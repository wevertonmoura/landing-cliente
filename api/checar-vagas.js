import { createClient } from '@supabase/supabase-js';

// 🚀 BUSCA SEGURA DAS VARIÁVEIS COM FALLBACK
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// ⚠️ Trava para avisar nos logs se a Vercel perder as chaves de novo
if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERRO CRÍTICO: Chaves do Supabase não encontradas no checar-vagas.js!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Prevenção de bloqueio de CORS na Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    // Conta exatamente quantos atletas já estão com status 'pago' na tabela nova
    const { count, error } = await supabase
      .from('inscricoes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pago');

    if (error) {
      console.error("Erro do Supabase ao contar vagas:", error);
      throw error;
    }

    res.status(200).json({ total: count || 0 });
  } catch (error) {
    console.error("Erro no servidor ao buscar vagas:", error);
    res.status(500).json({ error: 'Erro ao buscar vagas' });
  }
}