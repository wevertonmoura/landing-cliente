import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { action, codigo, senha, desconto_percentual, id } = req.body;

  try {
    const senhaCorreta = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;

    // ==========================================
    // TRAVA DE SEGURANÇA PARA AÇÕES DO ADMIN
    // ==========================================
    if (['criar', 'listar', 'excluir'].includes(action)) {
      if (senhaCorreta && senha !== senhaCorreta) {
        return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
      }
    }

    // AÇÃO: CRIAR
    if (action === 'criar') {
      if (!codigo) return res.status(400).json({ error: 'Código obrigatório.' });
      const { error } = await supabase.from('cupons').insert([{ 
        codigo: codigo.toUpperCase().trim(), 
        desconto_percentual: desconto_percentual || 10, 
        ativo: true 
      }]);
      if (error) {
        if (error.code === '23505') return res.status(400).json({ error: 'Este código já existe.' });
        throw error;
      }
      return res.status(200).json({ success: true });
    }

    // AÇÃO: LISTAR TODOS OS CUPONS
    if (action === 'listar') {
      const { data, error } = await supabase.from('cupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // AÇÃO: EXCLUIR CUPOM
    if (action === 'excluir') {
      if (!id) return res.status(400).json({ error: 'ID do cupom não informado.' });
      const { error } = await supabase.from('cupons').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // AÇÃO: VALIDAR (USADO PELO CORREDOR NO CHECKOUT - SEM SENHA)
    if (action === 'validar') {
      if (!codigo) return res.status(400).json({ error: 'Código não informado.' });
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', codigo.toUpperCase().trim())
        .eq('ativo', true)
        .single();

      if (error || !data) return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
      return res.status(200).json({ valido: true, desconto_percentual: data.desconto_percentual });
    }

    return res.status(400).json({ error: 'Ação inválida.' });

  } catch (error) {
    console.error(`Erro na API de cupom [${action}]:`, error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}