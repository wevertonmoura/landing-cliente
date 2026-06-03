import { createClient } from '@supabase/supabase-js';

// Pegamos a URL e a Chave das variáveis configuradas no seu .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Prevenção de bloqueio de CORS na Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método inválido' });
  }
  
  try {
    const { senha } = req.body;
    
    // Puxa a senha administrativa do seu .env (mantendo o seu plano B de contingência)
    const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

    if (senha !== senhaCorreta) {
      console.error("Acesso bloqueado: Senha digitada não confere.");
      return res.status(401).json({ error: 'Acesso negado' });
    }

    console.log("Acesso liberado. Buscando dados na tabela inscricoes...");

    // Busca os dados na tabela correta que criamos juntos
    const { data, error } = await supabase
      .from('inscricoes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Erro interno do Supabase:", error.message);
      return res.status(400).json({ error: error.message });
    }
    
    console.log(`Busca concluída! ${data ? data.length : 0} registros enviados para o painel.`);
    return res.status(200).json(data || []);

  } catch (err) {
    console.error("Erro no servidor da Vercel:", err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}