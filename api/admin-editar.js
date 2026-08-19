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
  
  // Recebendo os dados enviados pelo painel administrativo
  const { senha, id, nome, numero_peito, tamanho_camisa, equipe, whatsapp } = req.body;
  const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

  // 💡 CORREÇÃO 1: Validação de ID obrigatório
  if (!id) {
    return res.status(400).json({ error: 'O ID do inscrito é obrigatório para edição.' });
  }

  if (!senha) {
    return res.status(401).json({ error: 'A senha de administrador não foi fornecida.' });
  }

  // 💡 CORREÇÃO 2: Comparação segura de strings contra força bruta e timing attacks
  try {
    const bufferSenha = Buffer.from(senha);
    const bufferCorreta = Buffer.from(senhaCorreta);
    
    if (bufferSenha.length !== bufferCorreta.length || !crypto.timingSafeEqual(bufferSenha, bufferCorreta)) {
      return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
    }
  } catch (err) {
    return res.status(401).json({ error: 'Erro ao validar credenciais.' });
  }

  // 💡 CORREÇÃO 3: Tratamento seguro de conversão de tipos para evitar falhas no Supabase
  const numeroPeitoFormatado = (numero_peito !== undefined && numero_peito !== null && numero_peito !== '') 
    ? Number(numero_peito) 
    : null;

  console.log(`📝 Admin editando registro ID: ${id}`);

  // Atualização dos dados estruturada e segura
  const { error } = await supabase
    .from('inscricoes')
    .update({ 
      nome: nome || 'Sem Nome', 
      numero_peito: numeroPeitoFormatado, 
      tamanho_camisa: tamanho_camisa || 'M', 
      equipe: equipe || null, 
      telefone: whatsapp ? whatsapp.replace(/\D/g, '') : null // Limpa caracteres não numéricos do telefone
    })
    .eq('id', id);
  
  if (error) {
    console.error("❌ Erro ao editar no Supabase:", error.message);
    return res.status(400).json({ error: `Erro no banco de dados: ${error.message}` });
  }
  
  console.log(`✅ Registro ID ${id} atualizado com sucesso!`);
  return res.status(200).json({ success: true, message: 'Dados atualizados com sucesso.' });
}
