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
  
  // Recebendo os dados enviados pelo botão "Salvar Alterações" do painel
  const { senha, id, nome, numero_peito, tamanho_camisa, equipe, whatsapp } = req.body;
  const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

  if (senha !== senhaCorreta) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  // 🚀 CORREÇÃO AQUI: Removemos a tentativa de salvar na coluna "whatsapp" que não existe
  // e salvamos tudo certinho na coluna "telefone".
  const { error } = await supabase
    .from('inscricoes')
    .update({ 
      nome: nome, 
      numero_peito: numero_peito ? Number(numero_peito) : null, 
      tamanho_camisa: tamanho_camisa, 
      equipe: equipe, 
      telefone: whatsapp 
    })
    .eq('id', id);
  
  if (error) {
    console.error("Erro ao editar:", error);
    return res.status(400).json({ error: error.message });
  }
  
  return res.status(200).json({ success: true });
}