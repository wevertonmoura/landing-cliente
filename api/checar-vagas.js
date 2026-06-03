import { createClient } from '@supabase/supabase-js';

// Usando as suas chaves seguras do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
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