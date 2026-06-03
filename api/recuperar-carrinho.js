import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// Conectando com as chaves corretas configuradas no seu .env
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
  try {
    // 1. Busca inscrições pendentes, criadas há mais de 25 minutos e que ainda não receberam o lembrete
    const tempoLimite = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    
    const { data: pendentes, error } = await supabase
      .from('inscricoes')
      .select('*')
      .eq('status', 'pendente') // MUDANÇA: Usando o formato novo de status
      .eq('lembrete_enviado', false)
      .lt('created_at', tempoLimite);

    if (error) throw error;

    if (!pendentes || pendentes.length === 0) {
      return res.status(200).json({ message: 'Nenhum carrinho para recuperar agora.' });
    }

    // 2. Envia o e-mail para cada atleta da lista
    for (const inscrito of pendentes) {
      const mailOptions = {
        from: `"OS D'SEMPRE TRILHA" <${process.env.EMAIL_USER}>`,
        to: inscrito.email,
        subject: '⚠️ Sua vaga na OS D\'SEMPRE TRILHA está esperando!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #1e3a8a; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1e3a8a; padding: 20px; text-align: center; border-bottom: 4px solid #facc15;">
              <h2 style="color: #facc15; margin: 0; font-style: italic;">Olá, ${inscrito.nome}!</h2>
            </div>
            <div style="padding: 30px; background-color: #fafafa; color: #374151;">
              <p style="font-size: 16px;">Vimus que você iniciou sua inscrição para a <strong>OS D'SEMPRE TRILHA</strong>, mas o PIX expirou antes da confirmação do pagamento.</p>
              <p style="font-size: 16px;">As vagas estão sendo preenchidas constantemente! Não queremos que você fique de fora dessa grande experiência na natureza.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://vemparatrilha.vercel.app" style="background-color: #1e3a8a; color: #facc15; padding: 15px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; text-transform: uppercase; border: 2px solid #facc15;">Garantir minha vaga agora</a>
              </div>
              
              <p style="font-size: 12px; color: #666; background-color: #f3f4f6; padding: 10px; border-radius: 5px;">Se você já realizou o pagamento ou teve algum problema técnico recente, pode desconsiderar este aviso.</p>
              <p style="margin-top: 20px;">Nos vemos na trilha!<br><strong>Equipe OS D'SEMPRE</strong></p>
            </div>
          </div>
        `
      };

      // Só tenta disparar o e-mail se as credenciais do provedor existirem
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          await transporter.sendMail(mailOptions);
        } catch (emailErr) {
          console.error(`Falha ao enviar e-mail para ${inscrito.email}:`, emailErr);
        }
      }

      // 3. Marca no banco que o lembrete já foi processado (mesmo se o e-mail estiver desativado)
      await supabase
        .from('inscricoes')
        .update({ lembrete_enviado: true })
        .eq('id', inscrito.id);
    }

    return res.status(200).json({ message: `${pendentes.length} lembretes de recuperação processados!` });

  } catch (error) {
    console.error("Erro na recuperação de carrinhos:", error);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
}