import { createClient } from '@supabase/supabase-js';

// Usando a mesma lógica de variáveis do projeto da Trilha
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // === REGRAS DE CORS ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  // Padrão igualzinho ao projeto da Trilha
  const tokenMP = process.env.MP_ACCESS_TOKEN;
  
  if (!tokenMP) {
    console.error("ERRO GRAVE: MP_ACCESS_TOKEN não foi encontrado na Vercel!");
    return res.status(500).json({ error: 'Erro de Servidor', details: 'Token do MP ausente' });
  }

  const { participantes, valorTotal, emailPrincipal } = req.body;

  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    const webhookUrl = 'https://landing-cliente-two.vercel.app/api/webhook';

    // === 1. PRIMEIRO: GERAMOS O PIX ===
    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenMP}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${cpfTitular}` 
      },
      body: JSON.stringify({
        transaction_amount: Number(valorTotal),
        description: `Inscrição OS D'SEMPRE - ${participantes[0].name}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPrincipal || 'osdsempre@contato.com',
          first_name: firstName,
          last_name: lastName,
          identification: { type: 'CPF', number: cpfTitular }
        },
        external_reference: emailPrincipal, // <-- O pulo do gato da Trilha para o webhook!
        notification_url: webhookUrl
      })
    });

    const mpData = await response.json();

    // Se der erro na geração do PIX, paramos aqui e avisamos o usuário
    if (!mpData.id) {
      console.error("Erro na API do Mercado Pago:", mpData);
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();

    // === 2. SEGUNDO: SALVAMOS NO BANCO (Adaptado para Os D'Sempre) ===
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? p.cpf.replace(/\D/g, '') : null;

      return {
        payment_id: idDoPagamento,
        status: 'pendente', // Mantendo o formato do novo banco
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || null,
        telefone: index === 0 ? telefoneTitular : (p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular),
        cpf: cpfLimpo,
        emergencia_nome: p.emergencyName || participantes[0].emergencyName,
        emergencia_fone: p.emergencyPhone || participantes[0].emergencyPhone,
        valor_pago: index === 0 ? Number(valorTotal) : 0 
      };
    });

    const { error: erroInsert } = await supabase.from('inscricoes').insert(dadosParaSalvar);
    
    if (erroInsert) {
      console.error("Erro do Supabase:", erroInsert);
      throw new Error(`Erro do Banco de Dados: ${erroInsert.message}`);
    }

    // === 3. DEVOLVEMOS O QR CODE PARA A TELA ===
    res.status(200).json(mpData);

  } catch (error) {
    console.error("Erro no Servidor:", error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}