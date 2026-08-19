import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração completa de CORS para não bloquear o frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  const tokenMP = process.env.MP_ACCESS_TOKEN;
  
  if (!tokenMP) {
    console.error("ERRO: Token do Mercado Pago não encontrado nas variáveis de ambiente!");
    return res.status(500).json({ error: 'Erro de Servidor', details: 'Token do MP ausente' });
  }

  const { participantes, valorTotal, emailPrincipal } = req.body;

  try {
    // 1. Validações básicas de segurança
    if (!participantes || participantes.length === 0) {
      return res.status(400).json({ error: 'Nenhum participante enviado.' });
    }

    const primeiroAtleta = participantes[0];
    const cpfTitular = primeiroAtleta.cpf ? primeiroAtleta.cpf.replace(/\D/g, '') : '';
    const telefoneTitular = primeiroAtleta.phone ? primeiroAtleta.phone.replace(/\D/g, '') : '';
    
    if (!cpfTitular) {
      return res.status(400).json({ error: 'CPF do titular/primeiro participante é obrigatório.' });
    }

    // 💡 TRATAMENTO DO VALOR TOTAL: Remove "R$", espaços e corrige vírgulas para evitar NaN
    let valorLimpo = valorTotal;
    if (typeof valorLimpo === 'string') {
      valorLimpo = valorLimpo.replace(/R\$/g, '').replace(/\s/g, '').replace(',', '.');
    }
    const valorComComissao = Number(valorLimpo);

    if (isNaN(valorComComissao) || valorComComissao <= 0) {
      console.error(`❌ Valor total inválido recebido: ${valorTotal}`);
      return res.status(400).json({ error: 'O valor total enviado é inválido ou não pôde ser processado.' });
    }

    // Processamento do nome do pagador para a API
    const payerName = (primeiroAtleta.name || 'Participante').trim().split(" ");
    const firstName = payerName[0];
    const lastName = payerName.length > 1 ? payerName.slice(1).join(" ") : "Inscrito";
    
    // 💡 ATUALIZAÇÃO DINÂMICA DE DOMÍNIO: Captura o host atualizado automaticamente
    const host = req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    const webhookUrl = host.includes('localhost')
      ? 'https://vercel.app' 
      : `${protocol}://${host}/api/webhook`;

    console.log(`🌐 URL do Webhook configurada para esta transação: ${webhookUrl}`);

    const idempotencyKey = crypto.randomUUID();
    console.log("🔄 Disparando requisição ao gateway do Mercado Pago...");

    // 2. Chamada à API do Mercado Pago
    const response = await fetch('https://mercadopago.com', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenMP}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: valorComComissao,
        description: `Corrida de Aniversário OS D'SEMPRE - ${primeiroAtleta.name || 'Inscrição'}`,
        payment_method_id: 'pix',
        payer: {
          email: emailPrincipal || primeiroAtleta.email || 'osdsempre@contato.com',
          first_name: firstName,
          last_name: lastName,
          identification: { type: 'CPF', number: cpfTitular }
        },
        external_reference: emailPrincipal, 
        notification_url: webhookUrl
      })
    });

    // 💡 PROTEÇÃO CRÍTICA: Intercepta respostas de erro em HTML antes de tentar ler como JSON
    if (!response.ok) {
      const erroTexto = await response.text();
      console.error(`❌ O Mercado Pago recusou a chamada (Status HTTP ${response.status}):`, erroTexto);
      return res.status(response.status).json({ 
        error: 'O Mercado Pago recusou a geração do Pix devido a políticas cadastrais ou restrições da conta.', 
        details: erroTexto.substring(0, 250) // Expõe o erro tratado nos logs do frontend
      });
    }

    // Garante leitura de JSON estritamente seguro
    const mpData = await response.json();
    const idDoPagamento = mpData.id.toString();
    const cupomAplicado = primeiroAtleta.cupom_aplicado || null;

    console.log(`✅ Pix gerado com sucesso no MP. ID: ${idDoPagamento}`);

    // 3. Preparando o mapeamento em lote para o Supabase
    const dadosParaSalvar = participantes.map((p, index) => {
      const cpfLimpo = p.cpf ? p.cpf.replace(/\D/g, '') : cpfTitular;

      return {
        payment_id: idDoPagamento, 
        status: 'pendente', 
        nome: p.name || 'Sem Nome',
        equipe: p.equipe || primeiroAtleta.equipe || 'Individual',
        telefone: p.phone ? p.phone.replace(/\D/g, '') : telefoneTitular,
        cpf: cpfLimpo,
        email: p.email || emailPrincipal,
        valor_pago: index === 0 ? valorComComissao : 0,
        cupom_usado: cupomAplicado,
        tamanho_camisa: p.tamanho_camisa || p.camisa || 'M' 
      };
    });

    console.log("📝 Salvando registros iniciais como PENDENTE no Supabase...");

    // 4. Inserção no Banco de Dados
    const { data: inscricoesSalvas, error: erroInsert } = await supabase
      .from('inscricoes')
      .insert(dadosParaSalvar)
      .select();
    
    if (erroInsert) {
      console.error("❌ Erro retornado pelo Supabase no INSERT:", erroInsert.message);
      return res.status(500).json({ error: 'Erro ao salvar dados de inscrição no banco.', details: erroInsert.message });
    }

    // 5. Geração rápida e paralela dos números de peito sequenciais únicos
    if (inscricoesSalvas && inscricoesSalvas.length > 0) {
      console.log("🔢 Vinculando números de peito aos inscritos...");
      const promisesUpdate = inscricoesSalvas.map(inscricao => {
        const numeroPeitoUnico = inscricao.id + 1000;
        return supabase
          .from('inscricoes')
          .update({ numero_peito: numeroPeitoUnico })
          .eq('id', inscricao.id);
      });

      await Promise.all(promisesUpdate);
    }

    console.log("🚀 Fluxo concluído com êxito! Retornando payloads do Pix.");

    // 6. Resposta final enviada ao frontend para exibição da tela de pagamento
    return res.status(200).json({
      payment_id: mpData.id,
      qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64
    });

  } catch (error) {
    console.error("❌ Erro Crítico não tratado no manipulador:", error);
    return res.status(500).json({ error: error.message || 'Erro interno inesperado no servidor' });
  }
}
