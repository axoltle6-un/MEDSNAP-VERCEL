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
      env: {
        firebase: Boolean(
          process.env.FIREBASE_SERVICE_ACCOUNT ||
          process.env.GOOGLE_APPLICATION_CREDENTIALS
        ),
        smtp: Boolean(
          process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
        ),
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
