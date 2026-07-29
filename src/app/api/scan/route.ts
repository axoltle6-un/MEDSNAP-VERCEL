import { NextRequest, NextResponse } from "next/server";
import { identifyFromVerifiedSources } from "@/lib/verified-sources";
import { MEDICINE_DB } from "@/lib/medicine-db";
import type { MedicineResult } from "@/lib/types";
import { getClientIp, checkRateLimit, verifyAuthToken } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Minimum alphanumeric characters required from OCR before we attempt a match.
 * Shorter fragments are noise and produce false identifications.
 */
const MIN_QUERY_LEN = 4;

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

  // Require a usable query before hitting any matcher.
  //
  // The old threshold was 2 characters, which let OCR fragments like "ty" or
  // "ol" through. Those matched the built-in DB by substring (always
  // returning Tylenol) and, once that was fixed, still produced junk from
  // openFDA's fuzzy search — e.g. "ol" -> "%0.5 METRONIDAZOLE INFUSION".
  // Telling the user the photo was unreadable is far safer than showing a
  // confident report for a drug they aren't holding.
  if (!query || query.replace(/[^a-z0-9]/gi, "").length < MIN_QUERY_LEN) {
    return NextResponse.json(
      {
        error:
          "Could not read a medicine name from the photo. Try better lighting, hold the camera steady and closer to the label, or type the name manually.",
      },
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

/** Minimum query length before substring matching is trustworthy. */
const MIN_MATCH_LEN = 4;

/**
 * Split a brand field like "Tylenol / Panadol" into its individual names.
 */
function brandAliases(brandName: string): string[] {
  return (brandName || "")
    .toLowerCase()
    .split(/[\/,()]|\bor\b/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Whole-word (or word-prefix) match, so "no" cannot match "Tylenol". */
function matchesTerm(haystack: string, term: string): boolean {
  if (!haystack || !term || term.length < MIN_MATCH_LEN) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Term must start at a word boundary — matches "panadol" and "panadol-500",
  // but not the "no" inside "tylenol".
  return new RegExp(`\\b${escaped}`, "i").test(haystack);
}

/**
 * Match OCR text against the built-in database.
 *
 * Previously used bare `String.includes()` in both directions, which matched
 * on any substring. Because OCR routinely emits 2-3 character fragments and
 * "Tylenol / Panadol" is entry #1 in MEDICINE_DB, fragments like "ty", "le",
 * "no" or "ol" all matched it — so essentially every scan reported Tylenol.
 *
 * Now requires a word-boundary match of at least MIN_MATCH_LEN characters,
 * scores all candidates, and returns the best one rather than the first row
 * that happens to contain the substring.
 */
function matchDB(query: string): MedicineResult | null {
  const q = (query || "").toLowerCase().trim();
  if (q.length < MIN_MATCH_LEN) return null;

  // OCR text is multi-word; test each token as well as the whole string.
  const tokens = q.split(/\s+/).filter((t) => t.length >= MIN_MATCH_LEN);
  const terms = Array.from(new Set([q, ...tokens]));

  let best: { m: MedicineResult; score: number } | null = null;

  for (const m of MEDICINE_DB) {
    const generic = (m.genericName || "").toLowerCase();
    const genericRoot = generic.split("(")[0].trim();
    const imprint = (m.imprint ?? "").toLowerCase();
    let score = 0;

    for (const term of terms) {
      // Exact alias match is the strongest signal.
      for (const alias of brandAliases(m.brandName)) {
        if (alias === term) score += 100;
        else if (matchesTerm(alias, term)) score += 60;
      }
      if (genericRoot && genericRoot === term) score += 90;
      else if (matchesTerm(generic, term)) score += 50;

      for (const ing of m.activeIngredients || []) {
        if (matchesTerm((ing || "").toLowerCase(), term)) score += 30;
      }
    }

    // Imprint codes are short by nature, so compare them exactly.
    if (imprint && terms.some((t) => t === imprint)) score += 80;

    if (score > 0 && (!best || score > best.score)) best = { m, score };
  }

  // Require a real signal, not an incidental partial hit.
  return best && best.score >= 50 ? best.m : null;
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
