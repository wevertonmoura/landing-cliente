import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  'https://revyeudqlndidaiprabc.supabase.co',
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
  // Segurança: Apenas a Vercel ou você pode chamar este script
  // (Opcional: você pode adicionar uma chave de segurança aqui)

  try {
    // 1. Busca inscrições não pagas, criadas há mais de 25 minutos e menos de 2 horas
    // e que ainda não receberam o lembrete.
    const tempoLimite = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    
    const { data: pendentes, error } = await supabase
      .from('inscricao_trilha')
      .select('*')
      .eq('pago', false)
      .eq('lembrete_enviado', false)
      .lt('created_at', tempoLimite);

    if (error) throw error;

    if (!pendentes || pendentes.length === 0) {
      return res.status(200).json({ message: 'Nenhum carrinho para recuperar agora.' });
    }

    // 2. Envia o e-mail para cada um
    for (const inscrito of pendentes) {
      const mailOptions = {
        from: `"Vem Para Trilha" <${process.env.EMAIL_USER}>`,
        to: inscrito.email,
        subject: '⚠️ Sua vaga na Trilha 3 Reinos está esperando!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
            <h2 style="color: #10b981;">Olá, ${inscrito.nome}!</h2>
            <p>Vimos que você iniciou sua inscrição para a <strong>Trilha 3 Reinos</strong>, mas o PIX expirou antes da confirmação.</p>
            <p>As vagas são limitadas e estão acabando rápido! Não queremos que você fique de fora dessa imersão na natureza.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://trilha-3-reino.vercel.app" style="background-color: #10b981; color: white; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; text-transform: uppercase;">Garantir minha vaga agora</a>
            </div>
            
            <p style="font-size: 12px; color: #666;">Se você já realizou o pagamento ou teve algum problema técnico, ignore este e-mail ou chame nosso suporte no WhatsApp.</p>
            <p>Nos vemos na trilha!<br><strong>Equipe Vem Para Trilha</strong></p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);

      // 3. Marca no banco que o lembrete foi enviado para não repetir
      await supabase
        .from('inscricao_trilha')
        .update({ lembrete_enviado: true })
        .eq('id', inscrito.id);
    }

    return res.status(200).json({ message: `${pendentes.length} e-mails de recuperação enviados!` });

  } catch (error) {
    console.error("Erro na recuperação:", error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}