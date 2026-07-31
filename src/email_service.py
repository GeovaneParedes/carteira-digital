import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging

logger = logging.getLogger(__name__)

# Credenciais SMTP compartilhadas do ecossistema Harrison
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "devgegepythonjr@gmail.com"
SMTP_PASS = "ynwwmkeykijtvhih"

def enviar_email_codigo_recuperacao(destino_email: str, codigo: str) -> bool:
    """Envia o código de 6 dígitos para o e-mail cadastrado usando o SMTP do Gmail."""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔑 Seu Código de Recuperação: {codigo}"
        msg["From"] = f"Carteira Digital <{SMTP_USER}>"
        msg["To"] = destino_email

        html_content = f"""
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; padding: 30px; color: #f8fafc; border-radius: 16px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #38bdf8; margin-top: 0;">Carteira Digital Enterprise</h2>
            <p style="font-size: 14px; color: #94a3b8;">Recebemos uma solicitação de redefinição de senha para a sua conta.</p>
            
            <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px solid #334155;">
                <span style="font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Código de Verificação</span>
                <h1 style="font-size: 36px; color: #f59e0b; letter-spacing: 6px; margin: 10px 0 0 0;">{codigo}</h1>
            </div>

            <p style="font-size: 12px; color: #64748b;">Este código é válido por 15 minutos. Se você não solicitou a alteração, desconsidere este e-mail.</p>
        </div>
        """

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, destino_email, msg.as_string())

        logger.info(f"E-mail enviado com sucesso para {destino_email}")
        return True
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail de recuperação: {e}")
        return False
