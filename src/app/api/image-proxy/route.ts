import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 10;

/** Allowed domains for image proxy — prevents SSRF attacks while supporting medical & encyclopedic images */
const ALLOWED_DOMAINS = [
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "en.wikipedia.org",
  "wikimedia.org",
  "rximage.nlm.nih.gov",
  "dailymed.nlm.nih.gov",
  "fda.gov",
  "open.fda.gov",
  "nih.gov",
  "nlm.nih.gov",
];

function isAllowedUrl(urlStr: string): boolean {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    return false;
  }
  // HTTPS only. Permitting http: allowed a downgrade to cleartext and made
  // the private-IP checks below easier to reach via plain-HTTP internal hosts.
  if (url.protocol !== "https:") return false;

  // Reject embedded credentials (https://user:pass@host) — these can be used
  // to confuse allowlist checks and leak auth material to the upstream host.
  if (url.username || url.password) return false;
  // Block private/internal IPs
  const hostname = url.hostname;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    return false;
  }
  // Only allow whitelisted domains
  return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
}

/**
 * Image proxy — fetches medicine images from Wikipedia/Wikimedia/NIH/FDA
 * and serves them through our domain to avoid CORS/referrer issues.
 *
 * GET /api/image-proxy?url=https://upload.wikimedia.org/...
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  // SSRF protection: validate the URL before fetching
  if (!isAllowedUrl(url)) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MedSnap/1.0 (https://medsnap.app; contact@medsnap.app)",
      },
      signal: AbortSignal.timeout(8000),
      // Do not follow redirects: an allowlisted host could otherwise 302 the
      // proxy to an internal address, bypassing isAllowedUrl() entirely.
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      return NextResponse.json({ error: "Redirects are not permitted" }, { status: 502 });
    }

    if (!res.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    // Only proxy image content types
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 400 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy failed" }, { status: 502 });
  }
}
