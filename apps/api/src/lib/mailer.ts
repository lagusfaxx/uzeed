import nodemailer from 'nodemailer';
import { env } from './env.js';

export const mailer = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: env.smtpPort === 465,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.smtpHost) {
    console.log('[EMAIL-DEMO] to=', to, 'subject=', subject, '\n', html);
    return;
  }
  await mailer.sendMail({ from: env.emailFrom, to, subject, html });
}
