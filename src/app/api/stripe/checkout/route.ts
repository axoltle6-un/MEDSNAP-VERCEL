import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 20;

/**
 * Stripe secret key — environment only.
 *
 * NOTE: this file previously embedded a live-format `sk_test_...` key as
 * base64 with the comment "decoded at runtime to pass GitHub secret scanning
 * protection". Defeating secret scanning is not a security control — it only
 * suppresses the warning that would have caught this. Removed.
 */
function getStripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

/**
 * POST /api/stripe/checkout
 * Body: { plan: "monthly" | "yearly", email?: string }
 *
 * Creates a Stripe Checkout session for MedSnap Pro.
 * Supports Card, Apple Pay, Google Pay, PayPal, Link, etc. via Automatic Payment Methods.
 */
export async function POST(req: NextRequest) {
  let body: { plan?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const plan = body.plan === "yearly" ? "yearly" : "monthly";
  const email = body.email || "";

  const stripeKey = getStripeKey();
  if (!stripeKey) {
    console.error("[stripe/checkout] STRIPE_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Payments are not configured on this server.", demoMode: false },
      { status: 503 }
    );
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

    const origin = req.headers.get("origin") || "https://medsnap.vercel.app";
    const customPriceId = plan === "yearly"
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    // Line item configuration: use configured price ID or create inline price data dynamically
    const lineItem = customPriceId
      ? { price: customPriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan === "yearly" ? "MedSnap Pro (Yearly)" : "MedSnap Pro (Monthly)",
              description: "Unlimited AI pill vision scans, priority speed, and medical exports.",
            },
            unit_amount: plan === "yearly" ? 9999 : 1999, // $99.99/yr or $19.99/mo
            recurring: {
              interval: plan === "yearly" ? ("year" as const) : ("month" as const),
            },
          },
          quantity: 1,
        };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      // Enable Automatic Payment Methods: includes Credit Cards, Apple Pay, Google Pay, PayPal, Link, Klarna
      automatic_payment_methods: { enabled: true },
      customer_email: email || undefined,
      line_items: [lineItem],
      success_url: `${origin}/?stripe_success=true&plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?stripe_cancel=true`,
      metadata: { plan, email },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id, demoMode: false });
  } catch (err) {
    console.error("[stripe/checkout] error:", err);
    const msg = err instanceof Error ? err.message : "Stripe checkout session creation failed";
    return NextResponse.json({ error: msg, demoMode: false }, { status: 500 });
  }
}
