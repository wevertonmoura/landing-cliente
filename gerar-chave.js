const gerarToken = async () => {
  const dados = new URLSearchParams();
  
  // Aqui está o seu Client Secret real que pegamos na foto!
  dados.append('client_secret', 'F1t78lwFKpC1F3Rh6Zc0tpbq4cpTjaDx'); 

  dados.append('client_id', '3929957150105749');
  dados.append('grant_type', 'authorization_code');
dados.append('code', 'TG-6a230cd86e30060001a0eed4-323408935');
  dados.append('redirect_uri', 'https://landing-cliente-two.vercel.app/');

  try {
    const resposta = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: dados
    });
    const resultado = await resposta.json();
    console.log("🔥 SUCESSO! A chave foi gerada:\n", resultado);
  } catch (erro) {
    console.error("Deu erro:", erro);
  }
};

gerarToken();