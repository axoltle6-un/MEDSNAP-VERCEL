import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, adminSaveUserDoc } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * Stripe secret key — environment only. The previously embedded base64
 * `sk_test_...` fallback has been removed (base64 is not encryption).
 */
function getStripeKey(): string | null {
  return process.env.STRIPE_SECRET_KEY || null;
}

/**
 * POST /api/stripe/webhook
 *
 * Receives raw webhook events directly from Stripe.
 * Listens for `checkout.session.completed`, `customer.subscription.created`,
 * `customer.subscription.updated`, and `customer.subscription.deleted`.
 *
 * Automatically updates user Firestore documents with active Pro subscription status!
 */
export async function POST(req: NextRequest) {
  const stripeKey = getStripeKey();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey) {
    console.error("[stripe/webhook] STRIPE_SECRET_KEY is not configured");
    return NextResponse.json({ error: "Payments not configured" }, { status: 503 });
  }

  // CRITICAL: never process an unsigned event.
  //
  // This route previously fell back to `JSON.parse(rawBody)` when
  // STRIPE_WEBHOOK_SECRET was unset, meaning ANY anonymous POST could forge a
  // `checkout.session.completed` event and grant Pro to any email for free:
  //
  //   curl -X POST https://<host>/api/stripe/webhook -d '{
  //     "type":"checkout.session.completed",
  //     "data":{"object":{"customer_email":"me@example.com",
  //                       "metadata":{"plan":"yearly"}}}}'
  //
  // Signature verification is now mandatory — the endpoint fails closed.
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set — refusing to process.");
    return NextResponse.json(
      { error: "Webhook signature verification is not configured" },
      { status: 503 }
    );
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

  let event: any;

  try {
    const rawBody = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const email = session.customer_email || session.metadata?.email;
        const plan = session.metadata?.plan === "yearly" ? "yearly" : "monthly";

        if (email) {
          await updateUserProStatus(email, true, plan);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as any)?.email;
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
        const plan = interval === "year" ? "yearly" : "monthly";

        if (email) {
          await updateUserProStatus(email, isActive, plan);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        const email = (customer as any)?.email;

        if (email) {
          await updateUserProStatus(email, false, null);
        }
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe/webhook] Event processing error:", err);
    return NextResponse.json({ error: "Error processing event" }, { status: 500 });
  }
}

async function updateUserProStatus(email: string, isPro: boolean, plan: "monthly" | "yearly" | null) {
  try {
    const adminAuth = await getAdminAuth();
    if (!adminAuth) return;

    const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());

    // Admin SDK write — the client SDK has no authenticated user server-side.
    const ok = await adminSaveUserDoc(userRecord.uid, {
      isPro,
      proPlan: plan,
      proSince: isPro ? Date.now() : null,
      scansToday: 0,
    });

    if (!ok) {
      // Throw so Stripe retries the webhook rather than treating a lost
      // entitlement as delivered.
      throw new Error(`Failed to persist Pro status for ${email}`);
    }

    console.log(`[stripe/webhook] Updated Pro status for ${email}: isPro=${isPro}, plan=${plan}`);
  } catch (err) {
    console.error(`[stripe/webhook] Failed to update Firestore for ${email}:`, err);
  }
}
