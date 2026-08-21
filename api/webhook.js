import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// 🚀 BUSCA DIRETA E EXATA DAS VARIÁVEIS QUE VOCÊ MANDOU
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// ⚠️ Se o servidor não achar a chave, ele vai gritar no log antes de travar
if (!supabaseKey) {
  console.error("❌ ERRO GRAVE: A variável SUPABASE_ANON_KEY não foi carregada pela Vercel!");
}

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

    // 🚀 BUSCA EXATA DA CHAVE DO MERCADO PAGO QUE VOCÊ MANDOU
    const tokenMP = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${tokenMP}` }
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
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricoes')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          if (inscricoes[0].status === 'pendente') {
            
            console.log(`📝 Atualizando ${inscricoes.length} inscritos deste pagamento...`);

            const { error: erroUpdate } = await supabase
              .from('inscricoes')
              .update({ status: 'pago' })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              const nomesParticipantes = inscricoes.map(p => `
                <li style="margin-bottom: 10px;">
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
                      <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso.</p>
                      <p style="font-size: 16px;">Aqui estão os atletas confirmados nesta inscrição:</p>
                      <ul style="font-size: 16px; list-style-type: none; padding: 0;">
                        ${nomesParticipantes}
                      </ul>
                      
                      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #facc15;">
                        <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                        <p style="margin: 5px 0;">📅 <strong>Data:</strong> 29 de Novembro</p>
                        <p style="margin: 5px 0;">⏰ <strong>Horários:</strong> Concentração: 05h00 | Largada: 06h00</p>
                        <p style="margin: 5px 0;">📍 <strong>Local:</strong> Terminal da UR-11</p>
                      </div>

                      <p style="margin-top: 25px; text-align: center; font-size: 14px;">Qualquer dúvida, chame no WhatsApp: <br><a href="https://wa.me/5581988348592" style="color: #25D366; font-weight: bold; text-decoration: none; font-size: 18px;">(81) 98834-8592</a></p>
                      <p style="text-align: center;">Nos vemos na corrida!<br><strong>Equipe OS D'SEMPRE</strong></p>
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