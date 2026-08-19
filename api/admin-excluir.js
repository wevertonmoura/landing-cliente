import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto'; // Módulo nativo do Node.js para segurança

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Configuração completa de CORS para o Painel Administrativo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método inválido' });
  
  const { senha, id } = req.body;
  const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

  // 💡 CORREÇÃO 1: Validação prévia de campos obrigatórios
  if (!id) {
    return res.status(400).json({ error: 'O ID do inscrito é obrigatório para exclusão.' });
  }

  if (!senha) {
    return res.status(401).json({ error: 'A senha de administrador não foi fornecida.' });
  }

  // 💡 CORREÇÃO 2: Comparação segura de strings para evitar ataques de timing e força bruta
  try {
    const bufferSenha = Buffer.from(senha);
    const bufferCorreta = Buffer.from(senhaCorreta);
    
    if (bufferSenha.length !== bufferCorreta.length || !crypto.timingSafeEqual(bufferSenha, bufferCorreta)) {
      return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Erro ao validar credenciais.' });
  }

  console.log(`🗑️ Admin solicitou a exclusão do inscrito ID: ${id}`);

  // Executa a deleção no Supabase
  const { error } = await supabase
    .from('inscricoes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error("❌ Erro do Supabase ao deletar registro:", error.message);
    return res.status(400).json({ error: `Erro no banco de dados: ${error.message}` });
  }
  
  console.log(`✅ Inscrito ID ${id} deletado com sucesso.`);
  return res.status(200).json({ success: true, message: 'Inscrição removida com sucesso.' });
}
