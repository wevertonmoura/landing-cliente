import { createClient } from '@supabase/supabase-js';

// Conectando com as chaves do seu .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'ID do pagamento não fornecido' });
  }

  try {
    // 1. Buscamos a inscrição com esse ID diretamente no nosso banco de dados
    const { data, error } = await supabase
      .from('inscricoes')
      .select('status')
      .eq('payment_id', paymentId)
      .limit(1);

    if (error) {
      console.error("Erro ao checar Supabase:", error);
      throw error;
    }

    // 2. Se achou no banco e o status estiver como 'pago', nós avisamos o front-end!
    // (O front-end do seu App.tsx espera receber status: 'approved')
    if (data && data.length > 0 && data[0].status === 'pago') {
      return res.status(200).json({ status: 'approved' });
    }

    // Se ainda não estiver pago, retornamos pendente
    return res.status(200).json({ status: 'pending' });
    
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar o banco de dados' });
  }
}