export default async function handler(req, res) {
  const { paymentId } = req.query;

  if (!paymentId) {
    return res.status(400).json({ error: 'ID do pagamento não fornecido' });
  }

  try {
    // Aqui a mágica acontece: usamos process.env para puxar a senha escondida do Vercel
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` 
      }
    });
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao consultar o Mercado Pago' });
  }
}