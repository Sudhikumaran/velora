import nodemailer from "nodemailer";
import { logger } from "../middleware/logger.js";

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_FROM
  );
}

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_SECURE === "1",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(to, resetLink) {
  if (!isMailConfigured()) {
    throw new Error("Mail not configured");
  }
  const transport = createTransport();
  const from = process.env.MAIL_FROM;
  const appName = process.env.APP_NAME || "Velaro";
  try {
    await transport.sendMail({
      from,
      to,
      subject: `${appName} — reset your password`,
      text: `Reset your password (link expires in 1 hour):\n\n${resetLink}\n\nIf you didn't request this, ignore this email.`,
      html: `<p>Reset your password (link expires in 1 hour):</p><p><a href="${encodeURI(resetLink)}">Open reset link</a></p><p>If you didn't request this, ignore this email.</p>`,
    });
  } catch (e) {
    logger.error(e, "sendPasswordResetEmail failed");
    throw e;
  }
}
