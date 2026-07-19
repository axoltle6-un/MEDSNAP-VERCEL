import { NextRequest, NextResponse } from "next/server";
import { identifyFromVerifiedSources } from "@/lib/verified-sources";
import { MEDICINE_DB } from "@/lib/medicine-db";
import type { MedicineResult } from "@/lib/types";
import { getClientIp, checkRateLimit, verifyAuthToken } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Medicine identification endpoint.
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userToken = await verifyAuthToken(req);

  // Rate Limiting: 60 scans per 15 min for verified users, 20 for unverified/anonymous
  const limitKey = userToken ? `scan:uid:${userToken.uid}` : `scan:ip:${clientIp}`;
  const rateLimit = checkRateLimit(limitKey, userToken ? 60 : 20, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many identification requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  let body: {
    query: string;
    shape?: string;
    color?: string;
    photos?: string[];
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawQuery = (body.query || "").trim();
  if (!rawQuery) {
    return NextResponse.json(
      { error: "No text was read from the photo. Please try again with better lighting, or type the medicine name manually." },
      { status: 400 }
    );
  }

  const query = cleanQuery(rawQuery);
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Could not identify a medicine name from the photo. Please type the medicine name manually." },
      { status: 400 }
    );
  }

  // Step 1: Built-in database
  const dbMatch = matchDB(query);
  if (dbMatch) {
    return NextResponse.json({
      result: {
        ...dbMatch,
        matchNote: `OCR read "${query}" from photo · matched built-in database`,
        sources: dedupeSources([
          ...dbMatch.sources,
          { label: "openFDA Drug Label (FDA)", url: "https://open.fda.gov/data/downloads/" },
          { label: "RxNorm (NIH)", url: "https://rxnav.nlm.nih.gov" },
        ]),
      },
    });
  }

  // Step 2: Verified government sources
  try {
    const result = await identifyFromVerifiedSources({
      query,
      shape: body.shape,
      color: body.color,
    });
    return NextResponse.json({ result });
  } catch (err) {
    console.error("[scan] verified sources failed:", err);
    return NextResponse.json(
      {
        result: {
          id: `error-${Date.now()}`,
          brandName: "Search failed",
          genericName:
            "Could not reach verified medicine databases. Please check your internet connection and try again.",
          strengthValue: "?",
          strengthUnit: "",
          strengthDisplay: "Unknown",
          form: "unknown",
          usedFor: [],
          activeIngredients: [],
          commonSideEffects: [],
          seriousSideEffects: [],
          interactions: [],
          whoShouldAvoid: [],
          storageInstructions: "",
          confidence: "low",
          matchNote: `OCR read "${query}" but network error reaching databases`,
          sources: [],
        } as MedicineResult,
      },
      { status: 200 }
    );
  }
}

function matchDB(query: string): MedicineResult | null {
  const q = (query || "").toLowerCase().trim();
  for (const m of MEDICINE_DB) {
    const brand = (m.brandName || "").toLowerCase();
    const generic = (m.genericName || "").toLowerCase();
    const genericRoot = generic.split("(")[0].trim();
    const imprint = (m.imprint ?? "").toLowerCase();

    if (brand.includes(q) || (brand && q.includes(brand.split(" ")[0]))) return m;
    if (generic.includes(q) || (genericRoot && q.includes(genericRoot))) return m;
    if (imprint && (imprint.includes(q) || q.includes(imprint))) return m;
    for (const ing of (m.activeIngredients || [])) {
      if ((ing || "").toLowerCase().includes(q)) return m;
    }
  }
  return null;
}

function dedupeSources(sources: { label: string; url?: string }[]): { label: string; url?: string }[] {
  const seen = new Set<string>();
  const out: { label: string; url?: string }[] = [];
  for (const s of sources) {
    const key = (s.url || s.label || "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(s);
    }
  }
  return out.slice(0, 8);
}

function cleanQuery(rawQuery: string): string {
  let q = rawQuery.trim();

  const stripWords = [
    "directions", "warnings", "warning", "purpose", "uses", "active",
    "ingredients", "ingredient", "inactive", "dosage", "administration",
    "storage", "handling", "manufactured", "distributed", "pharmacist",
    "doctor", "medical", "health", "prescription", "caution", "keep",
    "away", "children", "adults", "apply", "affected", "area", "times",
    "daily", "external", "only", "relief", "reliever", "reducer", "pain",
    "fever", "allergy", "cough", "cold", "flu", "sinus", "strength",
    "maximum", "minimum", "fast", "hours", "value", "size", "sensitive",
    "skin", "anti", "itch", "cream", "ointment", "gel", "lotion", "spray",
    "drops", "syrup", "tablet", "capsule", "caplet", "oral", "topical",
    "questions", "ask", "call", "visit", "website", "www", "com",
    "copyright", "trademark", "registered", "inc", "corp", "llc",
    "company", "corporation", "laboratories", "pharmaceuticals", "pharma",
    "healthcare", "products", "package", "label", "insert", "patient",
    "information", "consumer", "summary", "net", "weight", "contents",
    "pfizer", "bayer", "novartis", "johnson", "janssen", "merck", "roche",
    "sanofi", "gsk", "glaxosmithkline", "abbvie", "lilly", "bristol",
    "myers", "squibb", "astrazeneca", "teva", "sandoz", "watson", "mylan",
    "allergan", "amgen", "gilead", "biogen", "moderna", "takeda",
    "boehringer", "ingelheim", "novo", "nordisk", "procter", "gamble",
    "church", "dwight", "purdue", "ranbaxy", "wockhardt", "lupin",
    "cipla", "aurobindo", "hikma", "reddys", "jubilant", "piramal",
    "lonza", "catalent", "patheon",
  ];

  const words = q.split(/[\s\n]+/);
  const filtered = words.filter((w) => {
    const lower = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (lower.length < 2) return false;
    if (stripWords.includes(lower)) return false;
    return true;
  });

  if (filtered.length === 0) return q;

  return filtered.slice(0, 4).join(" ");
}
