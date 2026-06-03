import { createClient } from '@supabase/supabase-js';

// Conectando com as chaves que colocamos no .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const { participantes, valorTotal, emailPrincipal, contatoEmergencia } = req.body;

  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    
    // ATENÇÃO: Certifique-se de que este é o domínio correto onde o site está hospedado
    const webhookUrl = 'https://vemparatrilha.vercel.app/api/webhook';

    // === 1. PRIMEIRO: GERAMOS O PIX NO MERCADO PAGO ===
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
        description: `Inscrição OS D'SEMPRE - ${participantes[0].name}`, // Nome atualizado
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

    if (!mpData.id) {
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();

    // === 2. SEGUNDO: SALVAMOS NA TABELA "inscricoes" DO SUPABASE ===
    const dadosParaSalvar = participantes.map((p, index) => {
      return {
        payment_id: idDoPagamento,
        status: 'pendente', // Usamos pendente em vez de pago: false
        tipo_inscricao: index === 0 ? 'titular' : 'acompanhante',
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || null, // Pegando o nome da equipe!
        whatsapp: p.phone || telefoneTitular,
        cpf: p.cpf ? p.cpf.replace(/\D/g, '') : null,
        email: p.email || emailPrincipal,
        emergencia_nome: p.emergencyName || participantes[0].emergencyName,
        emergencia_fone: p.emergencyPhone || participantes[0].emergencyPhone,
        valor_pago: index === 0 ? Number(valorTotal) : 0 // Titular guarda o valor total
      };
    });

    // Inserindo na tabela correta que criamos juntos
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