import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto'; // Nativo do Node.js, usado para criar um ID único seguro

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

  const tokenMP = process.env.MP_ACCESS_TOKEN;
  
  if (!tokenMP) {
    console.error("ERRO: Token do Mercado Pago não encontrado!");
    return res.status(500).json({ error: 'Erro de Servidor', details: 'Token do MP ausente' });
  }

  const { participantes, valorTotal, emailPrincipal } = req.body;

  try {
    // Validação básica para evitar quebras se o body vier vazio
    if (!participantes || participantes.length === 0) {
      return res.status(400).json({ error: 'Nenhum participante enviado.' });
    }

    const cpfTitular = participantes[0].cpf ? participantes[0].cpf.replace(/\D/g, '') : '';
    const telefoneTitular = participantes[0].phone ? participantes[0].phone.replace(/\D/g, '') : '';
    
    if (!cpfTitular) {
      return res.status(400).json({ error: 'CPF do titular é obrigatório.' });
    }

    const webhookUrl = 'https://aniversario-osdsempre.vercel.app/api/webhook';
    const valorComComissao = Number(valorTotal);

    const payerName = (participantes[0].name || 'Participante Anonimo').trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Participante";
    
    // 💡 CORREÇÃO 1: Gerando um UUID limpo e válido para o X-Idempotency-Key
    const idempotencyKey = crypto.randomUUID();

    console.log("🔄 Enviando requisição ao Mercado Pago...");

    // 1. Criando a cobrança PIX no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenMP}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: valorComComissao,
        description: `Corrida de Aniversário OS D'SEMPRE - ${participantes[0].name || 'Inscrição'}`,
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

    if (!response.ok || !mpData.id) {
      console.error("❌ Erro retornado pela API do Mercado Pago:", mpData);
      return res.status(400).json({ error: 'Erro na API do Mercado Pago', details: mpData });
    }

    const idDoPagamento = mpData.id.toString();
    const cupomAplicado = participantes[0].cupom_aplicado || null;

    // 2. Preparando os dados para salvar no Supabase como PENDENTE
    // 💡 CORREÇÃO 2: Garantindo fallback para strings vazias em vez de nulo caso o banco exija texto
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? p.cpf.replace(/\D/g, '') : cpfTitular; // Se o dependente não tiver CPF, usa do titular temporariamente ou string padronizada

      return {
        payment_id: idDoPagamento, 
        status: 'pendente', 
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || participantes[0].equipe || 'Individual',
        telefone: p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular,
        cpf: cpfLimpo,
        email: p.email || emailPrincipal,
        valor_pago: index === 0 ? Number(valorTotal) : 0,
        cupom_usado: cupomAplicado,
        tamanho_camisa: p.tamanho_camisa || p.camisa || 'M' 
      };
    });

    console.log("📝 Salvando registros pendentes no Supabase...");

    // 3. Inserindo as inscrições no banco de dados
    const { data: inscricoesSalvas, error: erroInsert } = await supabase
      .from('inscricoes')
      .insert(dadosParaSalvar)
      .select();
    
    if (erroInsert) {
      console.error("❌ Erro do Supabase ao inserir:", erroInsert);
      return res.status(500).json({ error: 'Erro ao salvar no Banco de Dados', details: erroInsert.message });
    }

    // 4. Gerando número de peito sequencial único para cada inscrito de forma otimizada
    if (inscricoesSalvas && inscricoesSalvas.length > 0) {
      console.log("🔢 Gerando números de peito...");
      
      // Criamos as atualizações em paralelo para rodar muito mais rápido
      const promisesUpdate = inscricoesSalvas.map(inscricao => {
        const numeroPeitoUnico = inscricao.id + 1000;
        return supabase
          .from('inscricoes')
          .update({ numero_peito: numeroPeitoUnico })
          .eq('id', inscricao.id);
      });

      await Promise.all(promisesUpdate);
    }

    console.log("✅ Tudo pronto! Retornando Pix para o frontend.");

    // 5. Retornando os dados do PIX para a tela do usuário (Copia e Cola + QR Code)
    return res.status(200).json({
      payment_id: mpData.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64
    });

  } catch (error) {
    console.error("❌ Erro Crítico no Servidor:", error);
    return res.status(500).json({ error: error.message || 'Erro interno ao processar inscrição' });
  }
}
