import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

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
    const paymentId = req.body?.data?.id || req.body?.id || req.query?.id || req.query['data.id'];
    const resourceType = req.body?.type || req.body?.resource;

    if (!paymentId) {
      console.log("⚠️ Notificação recebida sem ID de pagamento de origem.");
      return res.status(200).send('OK');
    }

    // Filtra para garantir que só processaremos notificações de pagamento reais
    if (resourceType && resourceType !== 'payment') {
      console.log(`ℹ️ Notificação ignorada: Recurso do tipo "${resourceType}" não é um pagamento.`);
      return res.status(200).send('OK');
    }

    console.log(`🔍 Mercado Pago notificou! Consultando status do ID: ${paymentId}`);

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    
    if (!mpResponse.ok) {
        const erroTexto = await mpResponse.text();
        console.error(`❌ Falha ao buscar detalhes no MP (Status ${mpResponse.status}):`, erroTexto);
        return res.status(200).send('Erro na API do MP');
    }

    const mpData = await mpResponse.json();
    console.log(`📊 Status retornado pelo Mercado Pago para o ID ${paymentId}: [${mpData.status}]`);

    if (mpData.status === 'approved') {
      const emailPrincipal = mpData.external_reference;
      const idDoPagamentoString = paymentId.toString(); 
      
      console.log(`✅ Pagamento CONFIRMADO no Mercado Pago para: ${emailPrincipal}`);

      if (idDoPagamentoString) {
        // === Busca pelo payment_id na tabela do Supabase ===
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricoes')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (erroBusca) {
          console.error("❌ Erro ao buscar inscrições pendentes no Supabase:", erroBusca.message);
          return res.status(500).send('Erro no banco');
        }

        if (inscricoes && inscricoes.length > 0) {
          
          // Verificamos o status do primeiro participante do grupo
          if (inscricoes[0].status === 'pendente') {
            
            console.log(`📝 Atualizando status de ${inscricoes.length} atletas para 'pago'...`);

            // === Atualiza em lote todos os atletas vinculados a este código Pix ===
            const { error: erroUpdate } = await supabase
              .from('inscricoes')
              .update({ status: 'pago' })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro fatal ao atualizar a coluna status no Supabase:", erroUpdate.message);
              return res.status(500).send('Erro ao atualizar status');
            }
            
            console.log("🚀 Banco de dados atualizado com SUCESSO! Inscrição agora está como PAGA.");
            
            // Monta dinamicamente as linhas HTML com os dados dos atletas inscritos
            const nomesParticipantes = inscricoes.map(p => `
              <li style="margin-bottom: 8px; padding: 10px; background-color: #e5e7eb; border-radius: 6px; list-style: none;">
                🎟️ <strong>${p.nome}</strong> <br/>
                <span style="font-size: 13px; color: #4b5563;">👕 Camisa: <strong>${p.tamanho_camisa || 'N/A'}</strong> | 🔢 Peito: <strong>#${p.numero_peito || 'A definir'}</strong></span>
              </li>`).join('');

            const mailOptions = {
              from: `"OS D'SEMPRE" <${process.env.EMAIL_USER}>`, 
              to: emailPrincipal,
              subject: '✅ Vaga Garantida: Corrida de Aniversário OS D\'SEMPRE!', 
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e3a8a; border-radius: 10px; overflow: hidden;">
                  <div style="background-color: #020412; padding: 20px; text-align: center; border-bottom: 4px solid #facc15;">
                    <h1 style="color: #facc15; margin: 0; font-style: italic; font-weight: 900; font-size: 24px;">PAGAMENTO CONFIRMADO!</h1>
                  </div>
                  <div style="padding: 30px; background-color: #fafafa; color: #374151;">
                    <p style="font-size: 16px;">Olá! Seu PIX foi aprovado com sucesso e sua vaga está garantida na <strong>Corrida de Aniversário OS D'SEMPRE</strong>.</p>
                    <p style="font-size: 16px;">Aqui estão os atletas confirmados nesta inscrição:</p>
                    
                    <ul style="font-size: 16px; padding: 0; margin: 0;">
                      ${nomesParticipantes}
                    </ul>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #facc15;">
                      <h3 style="margin-top: 0; color: #111827;">Resumo do Evento</h3>
                      <p style="margin: 5px 0;">📅 <strong>Data:</strong> 29 de novembro</p>
                      <p style="margin: 5px 0;">⏰ <strong>Horários:</strong> Concentração: 05h00 | Largada: 06h00</p>
                      <p style="margin: 5px 0;">📍 <strong>Local:</strong> Terminal da UR-11</p>
                    </div>

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
                console.log("📧 E-mail de confirmação enviado com sucesso.");
            } catch (eMailError) {
                console.error("⚠️ Erro ao disparar o e-mail pelo Nodemailer:", eMailError);
            }

          } else {
              console.log("ℹ️ Essa transação já constava como paga no Supabase. Nenhuma ação necessária.");
          }
        } else {
            console.log(`⚠️ Alerta: O pagamento ID ${idDoPagamentoString} foi aprovado no MP, mas esse ID não existe na tabela 'inscricoes'.`);
        }
      }
    } else {
        console.log(`ℹ️ Pagamento ID ${paymentId} recebeu atualização de status temporária: [${mpData.status}] (Aguardando aprovação final)`);
    }
    
    return res.status(200).send('Webhook processado');

  } catch (error) { 
    console.error("❌ Erro crítico interno no processamento do Webhook:", error); 
    return res.status(500).send('Erro interno');
  }
}
