import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // === REGRAS DE CORS ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { participantes, valorTotal, emailPrincipal } = req.body;
console.log("Token carregado:", process.env.MERCADOPAGO_ACCESS_TOKEN ? "SIM" : "NÃO");
  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    const webhookUrl = 'https://landing-cliente-two.vercel.app/api/webhook';

    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    // === REQUISIÇÃO LIMPA PARA O MERCADO PAGO ===
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        // CORREÇÃO 1: Ajustado para o nome EXATO que está no seu arquivo .env
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
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
        notification_url: webhookUrl
      })
    });

    const mpData = await response.json();

    if (!mpData.id) {
      console.error("Erro MP:", mpData);
      return res.status(400).json({ error: 'Erro Mercado Pago', details: mpData });
    }

    // === SALVANDO NO SUPABASE ===
    const idDoPagamento = mpData.id.toString();
    const dadosParaSalvar = participantes.map((p, index) => ({
      payment_id: idDoPagamento,
      status: 'pendente',
      nome: p.name || 'Sem Nome',
      equipe: p.equipe || null,
      telefone: p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular,
      cpf: p.cpf ? p.cpf.replace(/\D/g, '') : null,
      emergencia_nome: p.emergencyName || participantes[0].emergencyName,
      emergencia_fone: p.emergencyPhone || participantes[0].emergencyPhone,
      valor_pago: index === 0 ? Number(valorTotal) : 0 
    }));

    const { error: erroInsert } = await supabase.from('inscricoes').insert(dadosParaSalvar);
    
    // Convertendo o throw em return para não quebrar a API
    if (erroInsert) {
      console.error("Erro BD:", erroInsert);
      return res.status(500).json({ error: 'Erro ao salvar no banco de dados', details: erroInsert.message });
    }

    res.status(200).json(mpData);

  } catch (error) {
    // CORREÇÃO 2: Retornando um status HTTP adequado em vez de fechar a conexão bruscamente
    console.error("Detalhes do erro interno:", error);
    return res.status(500).json({ 
        error: "Falha na comunicação interna ou com o Mercado Pago.", 
        details: error.message || "Erro desconhecido" 
    });
  }
}