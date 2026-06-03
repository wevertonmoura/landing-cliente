import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Usando as suas chaves seguras do .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      const idDoPagamentoString = paymentId.toString(); 
      
      console.log(`✅ Pagamento APROVADO para: ${emailPrincipal}`);

      if (idDoPagamentoString) {
        // === Busca pelo payment_id na tabela nova ===
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricoes')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          // === MUDANÇA AQUI: Verificamos se o status ainda é 'pendente' ===
          if (inscricoes[0].status === 'pendente') {
            
            console.log(`📝 Atualizando ${inscricoes.length} inscritos deste pagamento...`);

            // === MUDANÇA AQUI: Atualizamos o status para 'pago' ===
            const { error: erroUpdate } = await supabase
              .from('inscricoes')
              .update({ status: 'pago' })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              // 3. Disparar E-mail de Confirmação (Atualizado para o tema OS D'SEMPRE)
              const nomesParticipantes = inscricoes.map(p => `<li>🎟️ <strong>${p.nome}</strong></li>`).join('');

              const mailOptions = {
                from: `"OS D'SEMPRE TRILHA" <${process.env.EMAIL_USER}>`, 
                to: emailPrincipal,
                subject: '✅ Vaga Garantida: OS D\'SEMPRE TRILHA!', 
                html: `
                  <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #1e3a8a; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #1e3a8a; padding: 20px; text-align: center; border-bottom: 4px solid #facc15;">
                      <h1 style="color: #facc15; margin: 0; font-style: italic; font-weight: 900;">PAGAMENTO CONFIRMADO!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #fafafa; color: #374151;">
                      <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso.</p>
                      <p style="font-size: 16px;">Aqui estão os atletas confirmados nesta inscrição:</p>
                      <ul style="font-size: 16px; list-style-type: none; padding: 0;">
                        ${nomesParticipantes}
                      </ul>
                      
                      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #1e3a8a;">
                        <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                        <p style="margin: 5px 0;">📅 <strong>Data:</strong> 28 de Junho de 2026</p>
                        <p style="margin: 5px 0;">⏰ <strong>Horários:</strong> Concentração: 05:30 | Largada: 06:30</p>
                        <p style="margin: 5px 0;">📍 <strong>Local:</strong> Jaboatão dos Guararapes (Suassuna)</p>
                      </div>

                      <p style="margin-top: 25px; font-size: 14px;">Qualquer dúvida, entre em contato via WhatsApp com a organização.</p>
                      <p>Nos vemos na trilha!<br><strong>Equipe OS D'SEMPRE</strong></p>
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