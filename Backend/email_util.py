# email_util.py
import os
import smtplib
from email.mime.text import MIMEText


def send_email(to_email: str, subject: str, body: str):
    gmail_user = os.getenv("GMAIL_USER")
    gmail_pass = os.getenv("GMAIL_PASS")

    if not gmail_user or not gmail_pass:
        raise RuntimeError("Missing GMAIL_USER or GMAIL_PASS env vars")

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = gmail_user
    msg["To"] = to_email

    host = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    port = int(os.getenv("EMAIL_PORT", "465"))

    
    if port == 587:
        with smtplib.SMTP(host, port) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            smtp.login(gmail_user, gmail_pass)
            smtp.send_message(msg)
    else:
        
        with smtplib.SMTP_SSL(host, port) as smtp:
            smtp.login(gmail_user, gmail_pass)
            smtp.send_message(msg)

    print(f"✅ Email sent to {to_email} | {subject}")
