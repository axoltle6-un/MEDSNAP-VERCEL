import { NextResponse } from "next/server";

/**
 * Health check endpoint.
 * Returns a simple JSON response to confirm the server is alive.
 * Used by the KeepAlive component to prevent the sandbox from going inactive.
 *
 * This endpoint is designed to be as fast and lightweight as possible —
 * no external API calls, no database access, just a JSON response.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check.
 *
 * SECURITY — this endpoint used to publicly return which providers were
 * configured (vision provider, model name, whether Firebase / SMTP / Stripe
 * were set up). That is a free reconnaissance map: it tells an attacker
 * exactly which integrations are unguarded and which model to target, and it
 * broadcast `stripeWebhook: false` — an open invitation to forge webhooks.
 *
 * Public callers now get liveness only. The capability breakdown is still
 * available for debugging, but requires HEALTH_DEBUG_TOKEN, sent either as
 * `Authorization: Bearer <token>` or `?token=`. Without the env var set the
 * detailed view is unreachable entirely, so it cannot be left on by accident.
 */
export async function GET(req: Request) {
  const debugToken = process.env.HEALTH_DEBUG_TOKEN;

  let authorised = false;
  if (debugToken) {
    const header = req.headers.get("authorization") || "";
    const bearer = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const qs = new URL(req.url).searchParams.get("token") || "";
    const supplied = bearer || qs;
    // Constant-time-ish compare: reject on length first, then char-by-char,
    // so we do not leak the token length through timing.
    authorised =
      supplied.length === debugToken.length &&
      supplied.split("").every((c, i) => c === debugToken[i]);
  }

  const body: Record<string, unknown> = {
    status: "ok",
    timestamp: Date.now(),
  };

  if (authorised) {
    body.env = {
      vision: Boolean(process.env.OMNIROUTE_API_KEY || process.env.MISTRAL_API_KEY),
      visionProvider: process.env.OMNIROUTE_API_KEY
        ? "omniroute"
        : process.env.MISTRAL_API_KEY
          ? "mistral"
          : null,
      visionModel: process.env.OMNIROUTE_API_KEY
        ? process.env.OMNIROUTE_MODEL || "auto"
        : process.env.MISTRAL_VISION_MODEL || "pixtral-12b-2409",
      omnirouteBaseUrl: process.env.OMNIROUTE_API_KEY
        ? process.env.OMNIROUTE_BASE_URL || "http://localhost:20128/v1"
        : null,
      aiText: Boolean(process.env.LLM7_API_KEY),
      firebase: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS
      ),
      firebaseClient: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
      smtp: Boolean(
        process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
      ),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      stripeWebhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    };
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
