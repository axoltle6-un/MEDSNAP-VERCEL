import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/stripe/demo-activate
 * Body: { email: string, plan: "monthly" | "yearly" }
 *
 * Demo mode — activates Pro without real payment.
 * Used for testing Pro features without a Stripe account.
 * When real Stripe keys are configured, the checkout route is used instead.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const plan = body.plan === "yearly" ? "yearly" : "monthly";

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  // Update Firebase user doc with Pro status
  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    // Verify user exists
    await adminAuth.getUserByEmail(email);

    // Save Pro status to Firestore
    const { saveUserDoc } = await import("@/lib/firestore-service");
    const userRecord = await adminAuth.getUserByEmail(email);
    await saveUserDoc(userRecord.uid, {
      isPro: true,
      proPlan: plan,
      proSince: Date.now(),
    } as any);

    console.log(`[stripe/demo-activate] Activated Pro (${plan}) for: ${email}`);

    return NextResponse.json({
      success: true,
      isPro: true,
      plan,
      demoMode: true,
      message: "Pro activated in demo mode. All Pro features unlocked.",
    });
  } catch (err) {
    console.error("[stripe/demo-activate] error:", err);
    return NextResponse.json({ error: "Failed to activate Pro" }, { status: 500 });
  }
}
