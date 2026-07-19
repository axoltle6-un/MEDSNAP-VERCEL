import { NextRequest, NextResponse } from "next/server";
import { searchVerifiedSources, identifyFromVerifiedSources } from "@/lib/verified-sources";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/search
 * Body: { query: string }
 *
 * Searches ONLY .gov sources (openFDA + RxNorm + DailyMed).
 * No built-in database — all results come from government databases.
 */
export async function POST(req: NextRequest) {
  let body: { query: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body.query || "").trim();
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  console.log("[/api/search] POST query:", query);

  // Search ONLY .gov verified sources
  const verifiedResults = await searchVerifiedSources(query).catch((err) => {
    console.error("[/api/search] verified sources failed:", err);
    return [];
  });

  console.log("[/api/search] Verified results:", verifiedResults.length);

  // Deduplicate by brand name — only keep ONE entry per unique brand name
  const seen = new Set<string>();
  const deduped = verifiedResults.filter(r => {
    const key = (r?.brandName || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort by relevance: exact matches first, then partial matches
  const queryLower = query.toLowerCase();
  const sorted = deduped.sort((a, b) => {
    const aBrand = (a?.brandName || "").toLowerCase();
    const bBrand = (b?.brandName || "").toLowerCase();
    const aGeneric = (a?.genericName || "").toLowerCase();
    const bGeneric = (b?.genericName || "").toLowerCase();

    // Exact brand match = best
    if (aBrand === queryLower) return -1;
    if (bBrand === queryLower) return 1;
    // Exact generic match = second best
    if (aGeneric === queryLower) return -1;
    if (bGeneric === queryLower) return 1;
    // Brand starts with query
    if (aBrand.startsWith(queryLower) && !bBrand.startsWith(queryLower)) return -1;
    if (bBrand.startsWith(queryLower) && !aBrand.startsWith(queryLower)) return 1;
    // Generic starts with query
    if (aGeneric.startsWith(queryLower) && !bGeneric.startsWith(queryLower)) return -1;
    if (bGeneric.startsWith(queryLower) && !aGeneric.startsWith(queryLower)) return 1;
    // Brand contains query
    if (aBrand.includes(queryLower) && !bBrand.includes(queryLower)) return -1;
    if (bBrand.includes(queryLower) && !aBrand.includes(queryLower)) return 1;

    return 0;
  });

  if (sorted.length > 0) {
    return NextResponse.json({
      results: sorted.slice(0, 8),
      source: "verified",
    });
  }

  return NextResponse.json({ results: [], source: "none" });
}

/**
 * GET /api/search?query=amoxicillin
 *
 * Generates a FULL report from .gov sources only (openFDA + RxNorm).
 * No built-in database — all data comes from FDA/NIH government databases.
 */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  console.log("[/api/search] GET full report for:", query);

  // Generate full report from .gov sources ONLY
  try {
    const result = await identifyFromVerifiedSources({ query });
    console.log("[/api/search] Found via .gov sources:", result.brandName);
    return NextResponse.json({ result, source: "verified" });
  } catch (err) {
    console.error("[/api/search] .gov sources failed:", err);
    return NextResponse.json(
      { error: "Could not find this medicine in FDA or NIH databases." },
      { status: 404 }
    );
  }
}
