import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { verifyCode } from "@/lib/auth-codes";
import { getClientIp, checkRateLimit } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/auth/reset-password
 * Body: { email: string, code: string, newPassword: string }
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const code = (body.code || "").trim();
  const newPassword = body.newPassword || "";
  const clientIp = getClientIp(req);

  if (!email || !code || !newPassword) {
    return NextResponse.json(
      { error: "Email, code, and new password are required" },
      { status: 400 }
    );
  }

  // Rate limit attempts
  const limit = await checkRateLimit(`reset-submit:ip:${clientIp}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many password reset attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  // Strict Password Strength Validation
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters long" },
      { status: 400 }
    );
  }
  if (
    !/[A-Z]/.test(newPassword) ||
    !/[a-z]/.test(newPassword) ||
    !/\d/.test(newPassword) ||
    !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  ) {
    return NextResponse.json(
      { error: "Password must contain an uppercase letter, a lowercase letter, a number, and a special character" },
      { status: 400 }
    );
  }

  // Constant-time hash verification against stored code
  const verification = await verifyCode("reset-password", email, code);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error || "Invalid or expired verification code" },
      { status: 400 }
    );
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: "Server authentication service unavailable." },
      { status: 500 }
    );
  }

  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    return NextResponse.json(
      { error: "No account found with this email" },
      { status: 404 }
    );
  }

  try {
    await adminAuth.updateUser(userRecord.uid, { password: newPassword });
    // Revoke existing refresh tokens so active sessions require re-authentication
    await adminAuth.revokeRefreshTokens(userRecord.uid);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/reset-password] update failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to update password";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
