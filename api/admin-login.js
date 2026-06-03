export default function handler(req, res) {
  // Prevenção de bloqueio de CORS na Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).send('Método inválido');

  const { senha } = req.body;
  const senhaCorreta = process.env.VITE_SENHA_ADMIN || '85113257@we';

  if (senha === senhaCorreta) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Acesso negado' });
  }
}