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

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: Date.now(),
      // Which capabilities are actually live. Reports presence only — never
      // the values. Photo scanning silently 503'd with no way to tell whether
      // the key was missing, so surface it here.
      env: {
        vision: Boolean(process.env.MISTRAL_API_KEY),
        visionModel: process.env.MISTRAL_VISION_MODEL || "pixtral-12b-2409",
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
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
