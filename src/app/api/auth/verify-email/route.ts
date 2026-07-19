import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { verifyCode } from "@/lib/auth-codes";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/auth/verify-email
 * Body: { email: string, code: string }
 *
 * Verifies the 6-digit email verification code and marks the user's email
 * as verified in Firebase Auth (using the Admin SDK).
 *
 * After this, sign-in will succeed and the app becomes usable.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const code = (body.code || "").trim();

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and code are required" },
      { status: 400 }
    );
  }

  // Verify the code
  const verification = verifyCode("verify-email", email, code);
  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.error || "Invalid verification code" },
      { status: 400 }
    );
  }

  // Get admin auth
  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json(
      { error: "Server not configured for email verification. Set FIREBASE_SERVICE_ACCOUNT env var." },
      { status: 500 }
    );
  }

  // Look up user
  let userRecord;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    return NextResponse.json(
      { error: "No account found with this email" },
      { status: 404 }
    );
  }

  // Mark email as verified
  try {
    await adminAuth.updateUser(userRecord.uid, { emailVerified: true });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/auth/verify-email] update failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to verify email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
