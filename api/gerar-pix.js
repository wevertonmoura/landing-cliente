import { createClient } from '@supabase/supabase-js';

// Usando exatamente as mesmas chaves do Webhook que está funcionando
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração de CORS para não bloquear o frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  // 🚀 CORREÇÃO: Usando a mesma chave do MP que funciona no Webhook
  const tokenMP = process.env.MP_ACCESS_TOKEN_CLIENTE;
  
  if (!tokenMP) {
    console.error("ERRO: Token do Mercado Pago não encontrado!");
    return res.status(500).json({ error: 'Erro de Servidor', details: 'Token do MP ausente' });
  }

  const { participantes, valorTotal, emailPrincipal } = req.body;

  try {
    const cpfTitular = participantes[0].cpf.replace(/\D/g, '');
    const telefoneTitular = participantes[0].phone.replace(/\D/g, '');
    
    // A URL para onde o MP vai avisar que o pix foi pago
    const webhookUrl = 'https://aniversario-osdsempre.vercel.app/api/webhook';
    const valorComComissao = Number(valorTotal);

    const payerName = participantes[0].name.trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    // 1. Criando a cobrança PIX no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenMP}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `pix-${Date.now()}-${cpfTitular}` 
      },
      body: JSON.stringify({
        transaction_amount: valorComComissao,
        description: `Corrida de Aniversário OS D'SEMPRE - ${participantes[0].name}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPrincipal || participantes[0].email || 'osdsempre@contato.com',
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
      console.error("Erro na API do Mercado Pago:", mpData);
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();
    const cupomAplicado = participantes[0].cupom_aplicado || null;

    // 2. Preparando os dados para salvar no Supabase como PENDENTE
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? p.cpf.replace(/\D/g, '') : null;

      return {
        payment_id: idDoPagamento, // Esse é o ID que o Webhook vai procurar depois
        status: 'pendente', 
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || (index > 0 ? participantes[0].equipe : null),
        telefone: index === 0 ? telefoneTitular : (p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular),
        cpf: cpfLimpo,
        email: index === 0 ? emailPrincipal : (p.email || emailPrincipal),
        valor_pago: index === 0 ? Number(valorTotal) : 0,
        cupom_usado: cupomAplicado,
        tamanho_camisa: p.tamanho_camisa || 'M' 
      };
    });

    // 3. Inserindo as inscrições no banco de dados
    const { data: inscricoesSalvas, error: erroInsert } = await supabase
      .from('inscricoes')
      .insert(dadosParaSalvar)
      .select();
    
    if (erroInsert) {
      console.error("Erro do Supabase:", erroInsert);
      throw new Error(`Erro do BD: ${erroInsert.message}`);
    }

    // 4. Gerando número de peito sequencial único para cada inscrito
    if (inscricoesSalvas && inscricoesSalvas.length > 0) {
      for (const inscricao of inscricoesSalvas) {
        const numeroPeitoUnico = inscricao.id + 1000;
        await supabase
          .from('inscricoes')
          .update({ numero_peito: numeroPeitoUnico })
          .eq('id', inscricao.id);
      }
    }

    // 5. Retornando os dados do PIX para a tela do usuário (Copia e Cola + QR Code)
    res.status(200).json({
      payment_id: mpData.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64
    });

  } catch (error) {
    console.error("Erro no Servidor:", error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}