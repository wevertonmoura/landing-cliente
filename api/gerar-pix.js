import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    const webhookUrl = 'https://vemparatrilha.vercel.app/api/webhook';

    // === 1. PRIMEIRO: GERAMOS O PIX PARA TER O ID DO PAGAMENTO ===
    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${cpfTitular}` 
      },
      body: JSON.stringify({
        transaction_amount: Number(valorTotal),
        description: `Inscrição Trilha - ${participantes[0].name}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPrincipal,
          first_name: firstName,
          last_name: lastName,
          identification: { type: 'CPF', number: cpfTitular }
        },
        external_reference: emailPrincipal, 
        notification_url: webhookUrl
      })
    });

    const mpData = await response.json();

    // Se der erro na geração do PIX, paramos aqui e avisamos o usuário
    if (!mpData.id) {
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();

    // === 2. SEGUNDO: SALVAMOS NO BANCO COM O ID ÚNICO (SEM DELETAR HISTÓRICO) ===
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? p.cpf.replace(/\D/g, '') : null;
      
      return {
        nome: p.name || 'Sem Nome',
        email: index === 0 ? emailPrincipal : (p.email || emailPrincipal),
        telefone: index === 0 ? telefoneTitular : (p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular),
        cpf: index === 0 ? cpfLimpo : null, 
        contato_emergencia: contatoEmergencia || null,
        pago: false,
        payment_id: idDoPagamento // <--- Aqui está o pulo do gato! Salvando o recibo!
      };
    });

    const { error: erroInsert } = await supabase.from('inscricao_trilha').insert(dadosParaSalvar);
    
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