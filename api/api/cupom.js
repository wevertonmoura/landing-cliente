// Importe seu banco de dados aqui (ex: import { sql } from '@vercel/postgres';)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Recebe a 'action' para saber se é o admin criando ou o corredor validando
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
      // Trava de segurança (só o Fábio com a senha consegue criar)
      if (senha !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Acesso negado: Senha incorreta.' });
      }

      // AQUI VOCÊ FAZ O INSERT NO BANCO:
      /*
      await sql`
        INSERT INTO cupons (codigo, desconto_percentual, ativo)
        VALUES (${codigoFormatado}, ${desconto_percentual}, true)
      `;
      */

      return res.status(200).json({ success: true, message: 'Cupom criado com sucesso!' });
    }

    // ==========================================
    // AÇÃO 2: CORREDOR VALIDANDO NO CHECKOUT
    // ==========================================
    if (action === 'validar') {
      // AQUI VOCÊ FAZ O SELECT NO BANCO:
      /*
      const { rows } = await sql`
        SELECT * FROM cupons WHERE codigo = ${codigoFormatado} AND ativo = true
      `;
      const cupom = rows[0];
      */

      // 👇 MOCK PARA VOCÊ TESTAR AGORA (Remova quando conectar o banco)
      const cupom = { codigo: codigoFormatado, desconto_percentual: 10, ativo: true };
      // 👆 FIM DO MOCK

      if (!cupom) {
        return res.status(404).json({ error: 'Cupom inválido ou expirado.' });
      }

      return res.status(200).json({ valido: true, desconto_percentual: cupom.desconto_percentual });
    }

    // Se a action não for nem 'criar' nem 'validar'
    return res.status(400).json({ error: 'Ação inválida.' });

  } catch (error) {
    console.error(`Erro na API de cupom [${action}]:`, error);
    
    // Se tentar criar um cupom com nome repetido
    if (action === 'criar' && (error.code === '23505' || error.message.includes('unique'))) { 
      return res.status(400).json({ error: 'Este código já existe.' });
    }

    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}