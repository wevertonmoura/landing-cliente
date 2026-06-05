import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // === 1. REGRAS DE SEGURANÇA (CORS) PARA A VERCEL NÃO BLOQUEAR ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    
    // === 2. URL ATUALIZADA DO SEU SITE PARA O WEBHOOK ===
    const webhookUrl = 'https://landing-cliente-two.vercel.app/api/webhook';

    // === 3. GERANDO O PIX NO MERCADO PAGO ===
    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        // 👇 ATUALIZAÇÃO 1: Usando a chave do seu cliente que salvamos na Vercel
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_CLIENTE}`,
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
        notification_url: webhookUrl,
        // 👇 ATUALIZAÇÃO 2: A MÁGICA DO SPLIT - Sua taxa retida automaticamente
        application_fee: 5.00
      })
    });

    const mpData = await response.json();

    if (!mpData.id) {
      console.error("Erro do Mercado Pago:", mpData);
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();

    // === 4. SALVANDO NO SUPABASE ===
    const dadosParaSalvar = participantes.map((p, index) => {
      return {
        payment_id: idDoPagamento,
        status: 'pendente',
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || null,
        telefone: p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular,
        cpf: p.cpf ? p.cpf.replace(/\D/g, '') : null,
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

    res.status(200).json(mpData);

  } catch (error) {
    console.error("Erro no Servidor:", error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}