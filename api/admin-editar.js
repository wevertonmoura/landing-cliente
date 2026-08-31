import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  try {
    // 🚀 Lendo o cupom_usado que agora o Painel Admin envia
    const { senha, id, nome, numero_peito, tamanho_camisa, equipe, whatsapp, cupom_usado } = req.body;
    
    const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';
    if (senha !== senhaCorreta) {
      return res.status(401).json({ error: 'Acesso negado' });
    }

    const { data, error } = await supabase
      .from('inscricoes')
      .update({
        nome,
        numero_peito: numero_peito || null,
        tamanho_camisa,
        equipe,
        telefone: whatsapp,
        cupom_usado: cupom_usado || null // 🚀 Salvando o cupom no banco de dados!
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Erro ao editar:", error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}