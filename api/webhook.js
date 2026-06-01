import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://revyeudqlndidaiprabc.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const paymentId = req.body?.data?.id || req.query?.id || req.query['data.id'];
    
    if (!paymentId) {
      console.log("⚠️ Notificação recebida sem ID de pagamento.");
      return res.status(200).send('OK');
    }

    console.log(`🔍 Processando pagamento ID: ${paymentId}`);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    if (!mpResponse.ok) {
        console.error("❌ Erro ao consultar Mercado Pago");
        return res.status(200).send('Erro na API do MP');
    }

    const mpData = await mpResponse.json();

    if (mpData.status === 'approved') {
      const emailPrincipal = mpData.external_reference;
      const idDoPagamentoString = paymentId.toString(); // ID que salvamos na nova coluna do banco
      
      console.log(`✅ Pagamento APROVADO para: ${emailPrincipal}`);

      if (idDoPagamentoString) {
        // === MUDANÇA AQUI: Buscamos pelo payment_id em vez do e-mail ===
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricao_trilha')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          if (!inscricoes[0].pago) {
            
            console.log(`📝 Atualizando ${inscricoes.length} inscritos deste pagamento...`);

            // === MUDANÇA AQUI: Atualizamos apenas quem tem esse payment_id ===
            const { error: erroUpdate } = await supabase
              .from('inscricao_trilha')
              .update({ pago: true })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              // 3. Disparar E-mail de Confirmação
              const nomesParticipantes = inscricoes.map(p => `<li>🎟️ <strong>${p.nome}</strong></li>`).join('');

              const mailOptions = {
                from: `"Vem Para Trilha" <${process.env.EMAIL_USER}>`, 
                to: emailPrincipal,
                subject: '✅ Vaga Garantida: Vem Para Trilha!', 
                html: `
                  <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #10b981; padding: 20px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-style: italic;">PAGAMENTO CONFIRMADO!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #fafafa; color: #374151;">
                      <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso.</p>
                      <p style="font-size: 16px;">Aqui estão os participantes confirmados nesta compra:</p>
                      <ul style="font-size: 16px; list-style-type: none; padding: 0;">
                        ${nomesParticipantes}
                      </ul>
                      
                      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                        <p style="margin: 5px 0;">📅 <strong>Data:</strong> 14/06/2026</p>
                        <p style="margin: 5px 0;">⏰ <strong>Horário:</strong> 07:00 às 12:00</p>
                        <p style="margin: 5px 0;">📍 <strong>Local:</strong> Guabiraba, Recife - PE</p>
                      </div>

                      <p style="margin-top: 25px; font-size: 14px;">Qualquer dúvida, chame no WhatsApp: <a href="https://wa.me/5581988227739" style="color: #10b981; font-weight: bold; text-decoration: none;">(81) 98822-7739</a></p>
                      <p>Nos vemos na trilha!<br><strong>Equipe Vem Para Trilha</strong></p>
                    </div>
                  </div>
                `
              };

              try {
                  await transporter.sendMail(mailOptions);
                  console.log("📧 E-mail enviado com sucesso.");
              } catch (eMailError) {
                  console.error("⚠️ Erro ao enviar e-mail:", eMailError);
              }
            }
          } else {
              console.log("ℹ️ Esta transação já estava marcada como paga.");
          }
        }
      }
    }
    
    return res.status(200).send('Webhook processado');

  } catch (error) { 
    console.error("❌ Erro crítico no Webhook:", error); 
    return res.status(500).send('Erro interno');
  }
}