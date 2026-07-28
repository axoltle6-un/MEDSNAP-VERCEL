import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { sendVerificationCodeEmail } from "@/lib/email";
import { storeCode } from "@/lib/auth-codes";
import { getClientIp, checkRateLimit } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/auth/send-reset-code
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
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  // Dual Rate Limit Check: Max 5 sends per email / 10 sends per IP per 15 minutes
  const emailLimit = checkRateLimit(`reset-code:email:${email}`, 5, 15 * 60 * 1000);
  const ipLimit = checkRateLimit(`reset-code:ip:${clientIp}`, 10, 15 * 60 * 1000);

  if (!emailLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Please wait 15 minutes before trying again." },
      { status: 429 }
    );
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: "Server authentication service unavailable." },
      { status: 500 }
    );
  }

  try {
    await adminAuth.getUserByEmail(email);
  } catch {
    // Return standard message to prevent account enumeration
    return NextResponse.json({ error: "If an account exists with this email, a code has been sent." }, { status: 200 });
  }

  // Generate cryptographically secure 6-digit code stored as SHA-256 hash
  const code = storeCode("reset-password", email);

  const result = await sendVerificationCodeEmail(email, code, "reset-password");
  if (result.sent) {
    return NextResponse.json({ sent: true });
  }

  if (result.error === "SMTP_NOT_CONFIGURED") {
    // NEVER return the code to the caller in production.
    //
    // This path returns the password-reset code directly in the HTTP
    // response. In production that is full account takeover: anyone could
    // POST an arbitrary email, read `devCode` from the JSON, and reset that
    // account's password.
    //
    // It was previously unreachable only because isEmailConfigured() was
    // hardcoded to `true`. Making SMTP fail closed exposed this path, so it
    // must be explicitly restricted to development.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({
        sent: false,
        devCode: code,
        devMode: true,
        message: "SMTP not configured. Use the dev code shown here (development only).",
      });
    }

    console.error("[/api/auth/send-reset-code] SMTP is not configured in production");
    return NextResponse.json(
      { error: "Password reset email could not be sent. Please contact support." },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { error: result.error || "Failed to send reset code email" },
    { status: 500 }
  );
}
