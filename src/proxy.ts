import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy (formerly "middleware" in Next.js < 16).
 *
 * Next.js 16 requires the exported function to be named `proxy` (or be a
 * default export). This function runs for every request matching the config
 * matcher below.
 *
 * Purpose: ensure API routes always return JSON, never HTML. Adds a header
 * to identify API requests so error handlers can format responses correctly.
 */
export function proxy(req: NextRequest) {
  // Only process API routes
  if (!req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  // Add a header so we can identify API requests in error handlers
  res.headers.set("x-api-request", "true");
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
