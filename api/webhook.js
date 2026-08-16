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

    // Consultando a conta do cliente para achar o pagamento
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN_CLIENTE}` }
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
          
          // === Verificamos se o status ainda é 'pendente' ===
          if (inscricoes[0].status === 'pendente') {
            
            console.log(`📝 Atualizando ${inscricoes.length} inscritos deste pagamento...`);

            // === Atualizamos o status para 'pago' ===
            const { error: erroUpdate } = await supabase
              .from('inscricoes')
              .update({ status: 'pago' })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              // 3. Disparar E-mail de Confirmação com Número de Peito e Tamanho da Camisa
              const nomesParticipantes = inscricoes.map(p => `
                <li style="margin-bottom: 8px; padding: 10px; background-color: #e5e7eb; border-radius: 6px;">
                  🎟️ <strong>${p.nome}</strong> <br/>
                  <span style="font-size: 13px; color: #4b5563;">👕 Camisa: <strong>${p.tamanho_camisa || 'N/A'}</strong> | 🔢 Peito: <strong>#${p.numero_peito || 'A definir'}</strong></span>
                </li>`).join('');

              const mailOptions = {
                from: `"OS D'SEMPRE" <${process.env.EMAIL_USER}>`, 
                to: emailPrincipal,
                subject: '✅ Vaga Garantida: Corrida de Aniversário OS D\'SEMPRE!', 
                html: `
                  <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #1e3a8a; border-radius: 10px; overflow: hidden;">
                    <div style="background-color: #020412; padding: 20px; text-align: center; border-bottom: 4px solid #facc15;">
                      <h1 style="color: #facc15; margin: 0; font-style: italic; font-weight: 900;">PAGAMENTO CONFIRMADO!</h1>
                    </div>
                    <div style="padding: 30px; background-color: #fafafa; color: #374151;">
                      <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso e sua vaga está garantida na <strong>Corrida de Aniversário OS D'SEMPRE</strong>.</p>
                      <p style="font-size: 16px;">Aqui estão os atletas confirmados nesta inscrição:</p>
                      
                      <ul style="font-size: 16px; list-style-type: none; padding: 0;">
                        ${nomesParticipantes}
                      </ul>
                      
                      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #facc15;">
                        <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                        <p style="margin: 5px 0;">📅 <strong>Data:</strong> 29 de novembro</p>
                        <p style="margin: 5px 0;">⏰ <strong>Horários:</strong> Concentração: 05h00 | Largada: 06h00</p>
                        <p style="margin: 5px 0;">📍 <strong>Local:</strong> Terminal da UR-11</p>
                      </div>

                      <!-- 🚀 SEÇÃO DO WHATSAPP AQUI -->
                      <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; border: 1px solid #bfdbfe;">
                        <p style="margin: 0; font-size: 15px; color: #1e3a8a;">
                          Qualquer dúvida, chame no WhatsApp: <br/>
                          <a href="https://wa.me/5581988348592" style="font-size: 18px; font-weight: bold; color: #25D366; text-decoration: none; display: inline-block; margin-top: 5px;">
                            📱 (81) 98834-8592
                          </a>
                        </p>
                      </div>

                      <p style="margin-top: 25px; text-align: center;">Prepare a energia e o sorriso! Nos vemos na corrida! 🏃‍♂️💨<br><strong>Equipe OS D'SEMPRE</strong></p>
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