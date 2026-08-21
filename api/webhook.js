import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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
      return res.status(200).send('OK');
    }

    console.log(`🔍 Webhook Acionado! Processando pagamento ID: ${paymentId}`);

    // 🚀 Lendo o token blindado igual fizemos no gerar-pix
    const tokenMP = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;

    if (!tokenMP) {
      console.error("❌ ERRO: Token do Mercado Pago não encontrado na Vercel para o Webhook!");
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${tokenMP}` }
    });
    
    if (!mpResponse.ok) {
        // 🔍 Se der erro, vamos ler a fofoca toda para saber o motivo!
        const detalheErro = await mpResponse.text();
        console.error(`❌ Erro MP! Status: ${mpResponse.status}. Detalhes: ${detalheErro}`);
        return res.status(200).send('Erro na API do MP');
    }

    const mpData = await mpResponse.json();

    if (mpData.status === 'approved') {
      const emailPrincipal = mpData.external_reference;
      const idDoPagamentoString = paymentId.toString(); 
      
      console.log(`✅ MP confirmou: PIX APROVADO para: ${emailPrincipal}`);

      if (idDoPagamentoString) {
        const { data: inscricoes, error: erroBusca } = await supabase
          .from('inscricoes')
          .select('*')
          .eq('payment_id', idDoPagamentoString);

        if (!erroBusca && inscricoes && inscricoes.length > 0) {
          
          // 🚀 CORREÇÃO AQUI: Removemos a trava do "pendente". Se não for pago, ele tratora e atualiza!
          if (inscricoes[0].status !== 'pago') {
            
            console.log(`📝 O status atual no banco é '${inscricoes[0].status}'. Forçando atualização para 'pago'...`);

            const { error: erroUpdate } = await supabase
              .from('inscricoes')
              .update({ status: 'pago' })
              .eq('payment_id', idDoPagamentoString);

            if (erroUpdate) {
              console.error("❌ Erro ao atualizar Supabase:", erroUpdate.message);
            } else {
              console.log("🚀 Banco de dados atualizado com SUCESSO!");
              
              // 🚀 NOVO VISUAL DO E-MAIL: Lista os atletas com Nome, Camisa e Peito (Sem CPF)
              const nomesParticipantes = inscricoes.map(p => `
                <li style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                  🎟️ <strong>Atleta: ${p.nome || 'Nome não informado'}</strong> <br/>
                  <span style="font-size: 14px; color: #4b5563;">
                    👕 Camisa: <strong>${p.tamanho_camisa || 'N/A'}</strong> | 🔢 Peito: <strong>#${p.numero_peito || 'A definir'}</strong>
                  </span>
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