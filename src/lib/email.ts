/**
 * Email sending utility — server-side only.
 *
 * Uses Nodemailer with SMTP.
 */

import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;
let _initAttempted = false;

/**
 * SMTP configuration — environment ONLY.
 *
 * A real Gmail address and its app password were previously hardcoded here as
 * fallbacks. In a public repo that is full send/receive control of the mailbox
 * that delivers this app's verification and password-reset codes — an attacker
 * could both read those codes and send mail as MedSnap.
 *
 * They have been removed. Revoke the exposed app password at
 * https://myaccount.google.com/apppasswords and issue a new one via env vars.
 */
const DEFAULT_SMTP_HOST = "smtp.gmail.com";
const DEFAULT_SMTP_PORT = "587";

/**
 * True only when real credentials are present.
 *
 * Previously this returned a hardcoded `true`, which made callers believe mail
 * was deliverable even with no configuration — so the "SMTP_NOT_CONFIGURED"
 * dev-code path could never trigger.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function getTransporter(): Promise<Transporter | null> {
  if (_transporter) return _transporter;
  if (_initAttempted) return _transporter;
  _initAttempted = true;

  // Fail closed when credentials are absent — never fall back to a baked-in
  // mailbox. Callers treat a null transporter as SMTP_NOT_CONFIGURED and
  // surface a dev code instead.
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP_USER/SMTP_PASS not set — email delivery disabled");
    return null;
  }

  try {
    const nodemailer = await import("nodemailer");
    const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    const portStr = process.env.SMTP_PORT || DEFAULT_SMTP_PORT;
    const user = process.env.SMTP_USER as string;
    const pass = process.env.SMTP_PASS as string;
    const port = parseInt(portStr, 10);
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    _transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
    console.log("[email] SMTP transporter created for", host);
    return _transporter;
  } catch (err) {
    console.error("[email] failed to create transporter:", err);
    return null;
  }
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; error?: string }> {
  const transporter = await getTransporter();
  if (!transporter) {
    return { sent: false, error: "SMTP_NOT_CONFIGURED" };
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "MedSnap";
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html || opts.text,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    const msg = err instanceof Error ? err.message : "Email send failed";
    return { sent: false, error: msg };
  }
}

/**
 * Send a 6-digit verification code email.
 */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
  purpose: "verify-email" | "reset-password"
): Promise<{ sent: boolean; error?: string }> {
  const subject =
    purpose === "verify-email"
      ? "Your MedSnap email verification code"
      : "Your MedSnap password reset code";
  const action =
    purpose === "verify-email"
      ? "verify your email"
      : "reset your password";

  const text = `Your MedSnap verification code is: ${code}

Enter this 6-digit code in the app to ${action}.

This code expires in 10 minutes. If you did not request this, you can safely ignore this email.

— MedSnap Team`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #0D6EFD; font-size: 24px; margin: 0;">MedSnap</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Medicine identification made simple</p>
  </div>
  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; text-align: center;">
    <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">Use the code below to ${action}:</p>
    <div style="display: inline-block; background: #0D6EFD; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; margin: 8px 0;">${code}</div>
    <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">This code expires in 10 minutes.</p>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
    If you did not request this, you can safely ignore this email.<br/>
    — MedSnap Team
  </p>
</div>`;

  return sendEmail({ to, subject, text, html });
}
