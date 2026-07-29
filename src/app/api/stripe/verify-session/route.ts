import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, adminSaveUserDoc } from "@/lib/firebase-admin";
import { getClientIp, checkRateLimit, verifyAuthToken } from "@/lib/api-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe secret key — environment only.
 *
 * A `sk_test_...` key was previously base64-embedded here as a fallback.
 * Base64 is encoding, not encryption (`base64 -d` reverses it instantly), so
 * that key was effectively published. It has been removed; the route now fails
 * closed if STRIPE_SECRET_KEY is unset.
 */
function getStripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

/**
 * POST /api/stripe/verify-session
 * Body: { sessionId: string }
 *
 * Verifies a completed Stripe Checkout session and activates Pro status.
 *
 * SECURITY: requires a Firebase ID token, and the session's email must match
 * the authenticated user. Without that check, any logged-in user who learned
 * *any* valid paid session id could replay it to upgrade an arbitrary account
 * (session ids appear in success URLs, browser history, referrer logs, etc.).
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const limit = checkRateLimit(`verify-session:ip:${clientIp}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait." },
      { status: 429 }
    );
  }

  const userToken = await verifyAuthToken(req);
  if (!userToken) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  const stripeKey = getStripeKey();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  if (!stripeKey) {
    console.error("[verify-session] STRIPE_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Payments are not configured on this server." },
      { status: 503 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" || session.status === "complete") {
      const email = session.customer_email || session.metadata?.email;
      const plan = (session.metadata?.plan === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";

      // Ownership check: the paid session must belong to the caller.
      const tokenEmail = (userToken.email || "").toLowerCase().trim();
      const sessionEmail = (email || "").toLowerCase().trim();

      if (!sessionEmail || !tokenEmail || sessionEmail !== tokenEmail) {
        console.warn(
          `[verify-session] Ownership mismatch: token=${tokenEmail} session=${sessionEmail}`
        );
        return NextResponse.json(
          { error: "This checkout session does not belong to the signed-in account." },
          { status: 403 }
        );
      }

      try {
        // Admin SDK write against the verified uid from the token.
        const ok = await adminSaveUserDoc(userToken.uid, {
          isPro: true,
          proPlan: plan,
          proSince: Date.now(),
          scansToday: 0,
        });
        if (!ok) {
          console.error("[verify-session] Pro entitlement was NOT persisted for", userToken.uid);
        }
      } catch (dbErr) {
        console.error("[verify-session] Firestore sync error:", dbErr);
      }

      return NextResponse.json({
        success: true,
        isPro: true,
        proPlan: plan,
        email,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "Payment not completed yet",
        status: session.payment_status,
      }, { status: 400 });
    }
  } catch (err) {
    console.error("[verify-session] Error retrieving session:", err);
    const msg = err instanceof Error ? err.message : "Failed to verify session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
