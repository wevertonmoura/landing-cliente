export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método inválido');

  const { senha } = req.body;

  if (senha === process.env.VITE_SENHA_ADMIN) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Acesso negado' });
  }
}
