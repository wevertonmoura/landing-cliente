import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase com as suas chaves seguras
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Recebe os dados do painel Admin ou do Checkout
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
      // Trava de segurança (só entra se a senha for igual a do .env)
      if (senha !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
      }

      // INSERT DE VERDADE NO SUPABASE
      const { error } = await supabase
        .from('cupons')
        .insert([{ 
          codigo: codigoFormatado, 
          desconto_percentual: desconto_percentual || 10, 
          ativo: true 
        }]);

      if (error) {
        // Verifica se tentou criar um código que já existe na tabela
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
      // SELECT DE VERDADE NO SUPABASE
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

    // Se a action não for nem 'criar' nem 'validar'
    return res.status(400).json({ error: 'Ação inválida.' });

  } catch (error) {
    console.error(`Erro na API de cupom [${action}]:`, error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}