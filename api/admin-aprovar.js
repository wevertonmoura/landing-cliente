import { createClient } from '@supabase/supabase-js';

// Usando as chaves do seu arquivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Prevenção de bloqueio de CORS na Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Método inválido');
  
  const { senha, id } = req.body;
  const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

  if (senha !== senhaCorreta) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  // Atualizando a tabela 'inscricoes' para o novo formato de status
  const { error } = await supabase
    .from('inscricoes')
    .update({ status: 'pago' })
    .eq('id', id);
    
  if (error) {
    console.error("Erro ao aprovar inscrição:", error);
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true });
}