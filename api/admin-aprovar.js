import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://revyeudqlndidaiprabc.supabase.co', process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método inválido');
  
  const { senha, id } = req.body;
  if (senha !== process.env.VITE_SENHA_ADMIN) return res.status(401).json({ error: 'Acesso negado' });

  const { error } = await supabase.from('inscricao_trilha').update({ pago: true }).eq('id', id);
  if (error) return res.status(400).json({ error });
  
  return res.status(200).json({ success: true });
}