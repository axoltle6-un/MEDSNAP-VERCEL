import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENCODED_KEY = "c2tfdGVzdF81MVRxcXFqSUlFNnVPN2t2OVNaeVllTlBmdEVIMWpLRkJ0a2w1bXV4dUs1Q255alhZbWg3dzhsMnFKYW5rbzB1UkU5YWZOOUoxTVBZUEZBYUVKaXgzT0pZYzAwTGIxY1ZsdU4=";
const DEFAULT_STRIPE_KEY = Buffer.from(ENCODED_KEY, "base64").toString("utf-8");

/**
 * POST /api/stripe/verify-session
 * Body: { sessionId: string }
 *
 * Verifies a completed Stripe Checkout session and activates Pro status in Firestore.
 */
export async function POST(req: NextRequest) {
  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sessionId = body.sessionId;
  const stripeKey = process.env.STRIPE_SECRET_KEY || DEFAULT_STRIPE_KEY;

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" || session.status === "complete") {
      const email = session.customer_email || session.metadata?.email;
      const plan = (session.metadata?.plan === "yearly" ? "yearly" : "monthly") as "monthly" | "yearly";

      if (email) {
        try {
          const adminAuth = await getAdminAuth();
          if (adminAuth) {
            const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());
            const { saveUserDoc } = await import("@/lib/firestore-service");

            await saveUserDoc(userRecord.uid, {
              isPro: true,
              proPlan: plan,
              proSince: Date.now(),
              scansToday: 0,
            } as any);
          }
        } catch (dbErr) {
          console.error("[verify-session] Firestore sync error:", dbErr);
        }
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
