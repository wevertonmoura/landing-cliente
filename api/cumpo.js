import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // === REGRAS DE CORS (Isto resolve o erro de "Falha de conexão") ===
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { action, codigo, senha, desconto_percentual } = req.body;

  if (!codigo) {
    return res.status(400).json({ error: 'Código do cupom é obrigatório.' });
  }

  const codigoFormatado = codigo.toUpperCase().trim();

  try {
    // ==========================================
    // AÇÃO 1: ADMIN CRIANDO O CUPOM
    // ==========================================
    if (action === 'criar') {
      // Puxa a senha do painel da Vercel
      const senhaCorreta = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
      
      if (senhaCorreta && senha !== senhaCorreta) {
        return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
      }

      // INSERT NO SUPABASE
      const { error } = await supabase
        .from('cupons')
        .insert([{ 
          codigo: codigoFormatado, 
          desconto_percentual: desconto_percentual || 10, 
          ativo: true 
        }]);

      if (error) {
        if (error.code === '23505') {
          return res.status(400).json({ error: 'Este código já existe.' });
        }
        throw error;
      }

      return res.status(200).json({ success: true, message: 'Cupom criado com sucesso!' });
    }

    // ==========================================
    // AÇÃO 2: CORREDOR VALIDANDO NO CHECKOUT
    // ==========================================
    if (action === 'validar') {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', codigoFormatado)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
      }

      return res.status(200).json({ valido: true, desconto_percentual: data.desconto_percentual });
    }

    return res.status(400).json({ error: 'Ação inválida.' });

  } catch (error) {
    console.error(`Erro na API de cupom [${action}]:`, error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}