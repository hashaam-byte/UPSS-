// /lib/email.js
// Shared SMTP sender so multiple routes don't each create their own
// nodemailer transporter. Same env vars as before (SMTP_HOST etc.) —
// see src/app/api/auth/reset-password/route.js for the original pattern
// this was extracted from.
import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST) {
    console.warn(`[Email] SMTP not configured. Would have sent to ${to}: ${subject}`);
    return { success: true, simulated: true };
  }

  try {
    await getTransporter().sendMail({
      from: `"U-Plus System" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      text: text || undefined,
    });
    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}
