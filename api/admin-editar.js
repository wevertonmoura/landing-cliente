import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { senha, id, nome, numero_peito, tamanho_camisa, equipe, whatsapp } = req.body;

  // Verifica a senha do administrador
  if (senha !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Senha de administrador incorreta' });
  }

  try {
    const { error } = await supabase
      .from('inscricoes')
      .update({ 
        nome: nome, 
        numero_peito: numero_peito ? Number(numero_peito) : null, 
        tamanho_camisa: tamanho_camisa, 
        equipe: equipe, 
        telefone: whatsapp, 
        whatsapp: whatsapp 
      })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro ao editar atleta:", err);
    return res.status(500).json({ error: err.message });
  }
}