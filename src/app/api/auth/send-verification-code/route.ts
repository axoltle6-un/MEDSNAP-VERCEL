import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { sendVerificationCodeEmail } from "@/lib/email";
import { storeCode } from "@/lib/auth-codes";
import { getClientIp, checkRateLimit } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/auth/send-verification-code
 * Body: { email: string }
 */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const clientIp = getClientIp(req);

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }

  // Dual Rate Limit Check: Max 5 sends per email / 10 sends per IP per 15 minutes
  const emailLimit = checkRateLimit(`send-verify:email:${email}`, 5, 15 * 60 * 1000);
  const ipLimit = checkRateLimit(`send-verify:ip:${clientIp}`, 10, 15 * 60 * 1000);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many verification requests. Please wait 15 minutes before trying again." },
      { status: 429 }
    );
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    console.error("[/api/auth/send-verification-code] Firebase Admin not configured");
    return NextResponse.json(
      { error: "Server authentication service unavailable." },
      { status: 500 }
    );
  }

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    // Avoid revealing account existence
    return NextResponse.json({ error: "No account found with this email address." }, { status: 404 });
  }

  if (userRecord.emailVerified) {
    return NextResponse.json({ sent: false, alreadyVerified: true });
  }

  // Generate cryptographically secure 6-digit code stored as SHA-256 hash
  const code = storeCode("verify-email", email);

  const result = await sendVerificationCodeEmail(email, code, "verify-email");

  if (result.sent) {
    return NextResponse.json({ sent: true });
  }

  if (result.error === "SMTP_NOT_CONFIGURED") {
    // Development only — see the note in send-reset-code. Returning the code
    // in the response body would let anyone verify an email they don't own.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        sent: false,
        devCode: code,
        devMode: true,
        message: "SMTP service inactive — dev mode code issued (development only).",
      });
    }

    console.error("[/api/auth/send-verification-code] SMTP is not configured in production");
    return NextResponse.json(
      { error: "Verification email could not be sent. Please contact support." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: result.error || "Failed to deliver verification code email." },
    { status: 500 }
  );
}
