import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, adminSaveUserDoc } from "@/lib/firebase-admin";
import { getClientIp, checkRateLimit, verifyAuthToken } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * POST /api/stripe/demo-activate
 * Body: { plan?: "monthly" | "yearly" }
 *
 * Demo mode — activates Pro WITHOUT payment, for local testing only.
 *
 * SECURITY: this endpoint grants a paid entitlement, so it is hard-disabled in
 * production. Previously it accepted an arbitrary `email` with no auth at all,
 * which let anyone grant themselves (or any known account) Pro for free:
 *
 *   curl -X POST https://<host>/api/stripe/demo-activate \
 *        -d '{"email":"victim@example.com","plan":"yearly"}'
 *
 * It now requires:
 *   1. A non-production environment (NODE_ENV !== "production"), AND
 *      an explicit ALLOW_DEMO_PRO=true opt-in.
 *   2. A valid Firebase ID token — the caller may only upgrade THEMSELVES.
 *      The email is derived from the verified token, never from the body.
 *   3. Rate limiting.
 *
 * Note: no UI calls this route. If you don't test Pro locally, delete it.
 */
export async function POST(req: NextRequest) {
  // 1. Hard kill-switch in production.
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_PRO !== "true") {
    // 404 rather than 403 so the route's existence isn't advertised.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 2. Rate limit.
  const clientIp = getClientIp(req);
  const limit = checkRateLimit(`demo-activate:ip:${clientIp}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many activation attempts. Please wait." },
      { status: 429 }
    );
  }

  // 3. Require a verified identity; self-service only.
  const userToken = await verifyAuthToken(req);
  if (!userToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  let body: { plan?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const plan = body.plan === "yearly" ? "yearly" : "monthly";

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  try {
    // Identity comes from the verified token — NOT from user-supplied input.
    const uid = userToken.uid;

    const ok = await adminSaveUserDoc(uid, {
      isPro: true,
      proPlan: plan,
      proSince: Date.now(),
    });
    if (!ok) {
      return NextResponse.json({ error: "Failed to activate Pro" }, { status: 500 });
    }

    console.log(`[stripe/demo-activate] DEV activation for uid=${uid} plan=${plan}`);

    return NextResponse.json({
      success: true,
      isPro: true,
      plan,
      demoMode: true,
      message: "Pro activated in demo mode (development only).",
    });
  } catch (err) {
    console.error("[stripe/demo-activate] error:", err);
    return NextResponse.json({ error: "Failed to activate Pro" }, { status: 500 });
  }
}
