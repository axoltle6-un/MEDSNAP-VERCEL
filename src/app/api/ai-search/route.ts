import { NextRequest, NextResponse } from "next/server";
import type { MedicineResult } from "@/lib/types";
import { identifyFromVerifiedSources } from "@/lib/verified-sources";
import { searchMedicines } from "@/lib/medicine-db";
import { recordUsage } from "@/app/api/ai-usage/route";
import { getClientIp, checkRateLimit, verifyAuthToken } from "@/lib/api-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

const NOT_FOUND = "Not found — please check the package insert or ask a pharmacist";

const AI_PROMPT = `You are MedSnap, a medicine identification assistant. You will be given a photo of a medicine (pill, tablet, capsule, syrup bottle, cream tube, or medicine box) and optionally some text info.

Your job is to:
1. Look at the photo and read ALL visible text — brand name, generic name, dosage (e.g. "500 mg"), manufacturer, form, imprint codes, etc.
2. Identify the medicine from what you see in the photo
3. Provide comprehensive, accurate medical information about it

Respond with STRICT JSON only — no prose, no markdown fences. Just the raw JSON object. Schema:

{"brandName":"string","genericName":"string","manufacturer":"string","strengthValue":"string","strengthUnit":"string","form":"tablet|capsule|syrup|injection|cream|drops|inhaler|patch|suppository|powder|unknown","packageSize":"string","usedFor":["string"],"activeIngredients":["string"],"commonSideEffects":["string"],"seriousSideEffects":["string"],"interactions":[{"with":"string","severity":"caution|avoid","note":"string"}],"whoShouldAvoid":[{"group":"string","reason":"string"}],"storageInstructions":"string","drugClass":"string","mechanismOfAction":"string","composition":"string","halfLife":"string","onsetOfAction":"string","durationOfAction":"string","metabolism":"string","excretion":"string","pregnancyCategory":"string","overdoseSymptoms":["string"],"whatToDoIfMissed":"string","dietaryAdvice":["string"],"relatedMedicines":["string"],"confidence":"high|medium|low","matchNote":"string"}

Rules:
- Read the photo carefully — identify brand name, generic name, dosage from the packaging/label.
- Base your medical info on established knowledge, not just what's visible in the photo.
- If the photo is unclear, try your best to identify from context clues (color, shape, markings).
- If you absolutely cannot identify the medicine, return brandName as "Unable to identify" and explain in matchNote.
- Do NOT fabricate. For fields you can't determine, use empty string or empty array.
- Do NOT wrap the JSON in markdown fences.`;

/**
 * API keys — environment ONLY.
 *
 * Hardcoded fallback keys were removed. They shipped in a public repository,
 * so anyone could read them and bill usage to this project's quota. If a key
 * is missing the route degrades to verified .gov sources instead of silently
 * using a leaked credential.
 *
 * Rotate any key that was ever committed — removing it from the working tree
 * does not remove it from git history.
 */
const LLM7_API_KEY = process.env.LLM7_API_KEY || "";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "";

/**
 * Vision model. Pixtral is the dedicated multimodal model and reads
 * pharmaceutical packaging more reliably than the general-purpose chat
 * models. Overridable so the model can be rolled forward without a deploy.
 */
const MISTRAL_VISION_MODEL = process.env.MISTRAL_VISION_MODEL || "pixtral-12b-2409";

/**
 * Words that appear on virtually every medicine package but identify nothing.
 *
 * openFDA's fuzzy search returns a confident product for each of these
 * ("solution" -> a sodium chloride label, "tablet" -> a random combination
 * product), so a query made up only of these must never reach it.
 */
const NON_IDENTIFYING_TERMS = new Set([
  "tablet", "tablets", "capsule", "capsules", "caplet", "caplets", "pill", "pills",
  "syrup", "suspension", "solution", "injection", "cream", "ointment", "gel",
  "lotion", "spray", "drops", "inhaler", "patch", "suppository", "powder",
  "oral", "topical", "sterile", "usp", "bp", "ip", "water", "each", "per",
  "mg", "mcg", "ml", "gm", "gram", "grams", "unit", "units", "dose", "doses",
  "strength", "extra", "maximum", "regular", "film", "coated", "coating",
  "medicine", "medication", "drug", "tab", "cap", "rx", "otc", "generic",
  "ingredients", "ingredient", "inactive", "active", "storage", "warning",
  "warnings", "directions", "uses", "purpose", "relief", "reliever",
]);

/**
 * True only if the text contains something that could plausibly name a
 * medicine — i.e. at least one >=4 character token that is not pure filler.
 */
function isIdentifiableQuery(text: string): boolean {
  const tokens = (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens.some(
    (t) => t.length >= 4 && !NON_IDENTIFYING_TERMS.has(t) && !/^\d+$/.test(t)
  );
}

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);
  const userToken = await verifyAuthToken(req);

  // Rate Limiting: 30 searches per 15 min for verified users, 10 for unverified/anonymous
  const limitKey = userToken ? `ai-search:uid:${userToken.uid}` : `ai-search:ip:${clientIp}`;
  const rateLimit = checkRateLimit(limitKey, userToken ? 30 : 10, 15 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many AI analysis requests. Please wait a few minutes before scanning again." },
      { status: 429 }
    );
  }

  let body: { ocrText?: string; query?: string; photos?: string[] };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ocrText = (body.ocrText || "").trim();
  const query = (body.query || "").trim();
  const photos = (body.photos || []).filter(Boolean);
  const searchText = (query || ocrText || "").trim();

  if (!searchText && photos.length === 0) {
    return NextResponse.json(
      { error: "Please provide a photo or medicine name" },
      { status: 400 }
    );
  }

  // With no photo, a too-short text query cannot be identified reliably.
  // (With a photo we still proceed — the vision model reads the label itself.)
  if (photos.length === 0 && searchText.replace(/[^a-z0-9]/gi, "").length < 4) {
    return NextResponse.json(
      {
        error:
          "Please enter at least 4 characters of the medicine name, or add a photo of the packaging.",
      },
      { status: 400 }
    );
  }

  // Build the user message
  let userMessage = "Please identify this medicine and provide comprehensive information.\n";
  if (query) userMessage += `\nUser-entered name: ${query}\n`;
  if (ocrText) userMessage += `\nAdditional info: ${ocrText}\n`;
  if (photos.length === 0) userMessage += `\n(No photo provided — identify from the name/info above)\n`;

  // Filter photos to reasonable size
  const imagesToSend = photos
    .filter((p) => p.length < 2_000_000)
    .slice(0, 2);

  const hasImages = imagesToSend.length > 0;

  // Photos are ALWAYS identifiable: Mistral Pixtral when a key is set,
  // otherwise the keyless LLM7 vision endpoint. Text-only requests fall back
  // to verified sources when no text provider is configured.
  if (!hasImages && !LLM7_API_KEY) {
    if (!isIdentifiableQuery(searchText)) {
      return NextResponse.json(
        {
          error:
            "Couldn't read a medicine name. Type the brand or generic name shown on the package and we'll search openFDA, RxNorm and DailyMed.",
        },
        { status: 400 }
      );
    }
    return fallbackToVerifiedSources(
      searchText,
      "AI text search unavailable — showing verified database results"
    );
  }

  try {
    let content: string;
    let usedVision = false;

    if (hasImages) {
      if (!MISTRAL_API_KEY) {
        // Be explicit about the cause. "Temporarily unavailable" gave no clue
        // that a single missing env var was responsible, which made this look
        // like a code bug for far longer than it should have.
        console.error(
          "[ai-search] MISTRAL_API_KEY is not set in this environment — vision disabled. " +
            "Set it in Vercel > Settings > Environment Variables, then redeploy."
        );
        return NextResponse.json(
          {
            error:
              "Photo scanning is not configured on the server (missing MISTRAL_API_KEY). " +
              "Type the medicine name to search verified databases instead.",
            code: "VISION_NOT_CONFIGURED",
            hint: "Set MISTRAL_API_KEY in Vercel > Settings > Environment Variables, then redeploy.",
          },
          { status: 503 }
        );
      }

      // Pixtral only. No free/keyless model fallback: a weaker model returns
      // lower-confidence, less complete reports (missing strengths, "See
      // label"), and silently degrading accuracy on a medical tool is worse
      // than surfacing an error.
      console.log(`[ai-search] Vision via ${MISTRAL_VISION_MODEL}`);
      content = await callMistral(userMessage, imagesToSend);
      recordUsage("mistral", content.length);
      usedVision = true;
    } else {
      console.log("[ai-search] Using LLM7 codestral (text, free)");
      content = await callLLM7(userMessage);
      recordUsage("llm7", content.length);
    }

    // Strip markdown fences
    let cleanContent = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    // Extract JSON
    const jsonStart = cleanContent.indexOf("{");
    const jsonEnd = cleanContent.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("[ai-search] no JSON found, falling back to verified sources");
      return fallbackToVerifiedSources(searchText, "AI returned invalid format — using verified sources");
    }
    cleanContent = cleanContent.slice(jsonStart, jsonEnd + 1);

    // Clean up JSON
    cleanContent = cleanContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    cleanContent = cleanContent.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g, "\u0026");
    cleanContent = cleanContent.replace(/,\s*([}\]])/g, "$1");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleanContent);
    } catch {
      console.error("[ai-search] JSON parse failed, falling back to verified sources");
      return fallbackToVerifiedSources(searchText, "AI returned invalid JSON — using verified sources");
    }

    // Assemble MedicineResult
    const result: MedicineResult = {
      id: `ai-${Date.now()}`,
      brandName: (parsed.brandName as string) || "Unknown",
      genericName: (parsed.genericName as string) || NOT_FOUND,
      manufacturer: (parsed.manufacturer as string) || undefined,
      strengthValue: normalizeStrength(parsed.strengthValue) || "?",
      strengthUnit: normalizeStrength(parsed.strengthUnit),
      strengthDisplay:
        parsed.strengthValue && parsed.strengthUnit
          ? formatStrength(parsed.strengthValue, parsed.strengthUnit)
          : "See label",
      form: (parsed.form as MedicineResult["form"]) || "unknown",
      packageSize: (parsed.packageSize as string) || undefined,
      usedFor: (parsed.usedFor as string[]) || [],
      activeIngredients: (parsed.activeIngredients as string[]) || [],
      commonSideEffects: (parsed.commonSideEffects as string[]) || [],
      seriousSideEffects: (parsed.seriousSideEffects as string[]) || [],
      interactions: (parsed.interactions as MedicineResult["interactions"]) || [],
      whoShouldAvoid: (parsed.whoShouldAvoid as MedicineResult["whoShouldAvoid"]) || [],
      storageInstructions: (parsed.storageInstructions as string) || NOT_FOUND,
      confidence: (parsed.confidence as MedicineResult["confidence"]) || "medium",
      matchNote: `AI-identified${usedVision ? " from photo" : ""} · ${(parsed.matchNote as string) || ""}`.trim(),
      sources: usedVision
        ? [
            { label: "AI Analysis (Mistral Pixtral)", url: "https://mistral.ai" },
            { label: "openFDA Drug Label (FDA)", url: "https://open.fda.gov/data/downloads/" },
          ]
        : [
            { label: "AI Analysis (Codestral)", url: "https://llm7.io" },
            { label: "openFDA Drug Label (FDA)", url: "https://open.fda.gov/data/downloads/" },
          ],
      drugClass: (parsed.drugClass as string) || undefined,
      mechanismOfAction: (parsed.mechanismOfAction as string) || undefined,
      howItWorks: (parsed.mechanismOfAction as string) || undefined,
      composition: (parsed.composition as string) || undefined,
      halfLife: (parsed.halfLife as string) || undefined,
      onsetOfAction: (parsed.onsetOfAction as string) || undefined,
      durationOfAction: (parsed.durationOfAction as string) || undefined,
      metabolism: (parsed.metabolism as string) || undefined,
      excretion: (parsed.excretion as string) || undefined,
      pregnancyCategory: (parsed.pregnancyCategory as string) || undefined,
      overdoseSymptoms: (parsed.overdoseSymptoms as string[]) || undefined,
      whatToDoIfMissed: (parsed.whatToDoIfMissed as string) || undefined,
      dietaryAdvice: (parsed.dietaryAdvice as string[]) || undefined,
      relatedMedicines: (parsed.relatedMedicines as string[]) || undefined,
    };

    return NextResponse.json({ result });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error("[ai-search] AI call failed:", detail);

    // A failed VISION call must not silently become a text search — that is
    // how a photo of drug A ended up reported as drug B. Surface the real
    // reason (quota, auth, timeout) so it is diagnosable.
    if (hasImages) {
      const isAuth = /401|403|unauthor|invalid.*key/i.test(detail);
      const isQuota = /429|quota|rate.?limit|capacity/i.test(detail);
      return NextResponse.json(
        {
          error: isAuth
            ? "Photo scanning failed: the Mistral API key was rejected. Check MISTRAL_API_KEY in Vercel."
            : isQuota
              ? "Photo scanning is rate-limited right now. Wait a moment and try again, or type the medicine name."
              : "Couldn't read the photo just now. Try again, or type the medicine name shown on the package.",
          code: isAuth ? "VISION_AUTH_FAILED" : isQuota ? "VISION_RATE_LIMITED" : "VISION_FAILED",
          detail: detail.slice(0, 200),
        },
        { status: isAuth ? 503 : 502 }
      );
    }

    return fallbackToVerifiedSources(searchText, "AI service unavailable — using verified sources");
  }
}

async function callLLM7(userMessage: string): Promise<string> {
  const res = await fetch("https://api.llm7.io/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LLM7_API_KEY}`,
    },
    body: JSON.stringify({
      model: "codestral-latest",
      messages: [
        { role: "system", content: AI_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM7 API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}


/**
 * Combination products make the model return arrays for strength fields even
 * though the schema asks for strings (e.g. ["400","60"] with
 * ["mg (Ibuprofen)","mg (Pseudoephedrine HCl)"]). Naive interpolation produced
 * "400,60 mg (Ibuprofen),mg (Pseudoephedrine HCl)". Normalise to readable text.
 */
function normalizeStrength(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).map(String).join(" + ");
  return v == null ? "" : String(v);
}

/** Pair each value with its unit so combinations read "400 mg + 60 mg". */
function formatStrength(value: unknown, unit: unknown): string {
  const vs = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  const us = Array.isArray(unit) ? unit.map(String) : [String(unit ?? "")];
  if (vs.length > 1 || us.length > 1) {
    const n = Math.max(vs.length, us.length);
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const v = (vs[i] ?? "").trim();
      const u = (us[i] ?? us[0] ?? "").trim();
      if (v || u) parts.push(`${v} ${u}`.trim());
    }
    return parts.join(" + ");
  }
  return `${vs[0]} ${us[0]}`.trim();
}

async function callMistral(userMessage: string, images: string[]): Promise<string> {
  const userContent = [
    { type: "text", text: userMessage },
    ...images.slice(0, 2).map((url) => ({
      type: "image_url",
      image_url: { url },
    })),
  ];

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_VISION_MODEL,
      messages: [
        { role: "system", content: AI_PROMPT },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
    signal: AbortSignal.timeout(55000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Mistral API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

async function fallbackToVerifiedSources(
  query: string,
  reason: string
): Promise<NextResponse> {
  const searchTerm = (query || "").trim();
  console.log("[ai-search] Falling back to verified sources for:", searchTerm || "(no text)");

  // Guard the fallback itself: filler-only text ("tablet", "solution 500 mg")
  // must not be searched, or openFDA returns an unrelated product.
  if (searchTerm && !isIdentifiableQuery(searchTerm)) {
    return NextResponse.json(
      {
        error:
          "Could not identify a medicine name. Please type the brand or generic name shown on the package.",
      },
      { status: 400 }
    );
  }

  if (!searchTerm) {
    return NextResponse.json({
      result: {
        id: `no-text-${Date.now()}`,
        brandName: "Please type a medicine name",
        genericName: "The AI needs a medicine name to generate a report.",
        strengthValue: "?",
        strengthUnit: "",
        strengthDisplay: "—",
        form: "unknown",
        usedFor: [],
        activeIngredients: [],
        commonSideEffects: [],
        seriousSideEffects: [],
        interactions: [],
        whoShouldAvoid: [],
        storageInstructions: "",
        confidence: "low",
        matchNote: reason,
        sources: [
          { label: "openFDA Drug Label (FDA)", url: "https://open.fda.gov/data/downloads/" },
          { label: "RxNorm (NIH)", url: "https://rxnav.nlm.nih.gov" },
        ],
      },
    });
  }

  try {
    // searchMedicines() now returns [] on no match. It previously returned
    // the first rows of MEDICINE_DB, so `dbMatch[0]` was Tylenol for every
    // unrecognised scan — reported to the user as a confident match.
    //
    // Also verify the hit actually corresponds to the query rather than
    // trusting a low-scoring fuzzy result.
    // Match on individual meaningful tokens, not the whole string.
    //
    // OCR returns full label text ("PANADOL paracetamol 500mg tablets GSK").
    // Testing that entire string against the DB never matched, so real scans
    // fell through to "Unable to identify". Check each non-filler token and
    // require one to line up with a brand / generic / ingredient.
    const candidateTokens = searchTerm
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 4 && !NON_IDENTIFYING_TERMS.has(t) && !/^\d+$/.test(t));

    // Search using the most distinctive token so multi-word OCR text still
    // reaches the scorer (searchMedicines scores the whole string, which
    // dilutes badly when 5 of 6 words are packaging boilerplate).
    const searchKey = candidateTokens.length
      ? candidateTokens.slice().sort((a, b) => b.length - a.length)[0]
      : searchTerm;

    const dbMatch = searchMedicines(searchKey, 1).filter((m) => {
      const hay = [
        m.brandName || "",
        m.genericName || "",
        ...(m.activeIngredients || []),
      ]
        .join(" ")
        .toLowerCase();
      return candidateTokens.some((t) =>
        new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(hay)
      );
    });

    if (dbMatch.length > 0) {
      recordUsage("verified");
      const result = {
        ...dbMatch[0],
        matchNote: `${reason} · matched built-in database`,
        sources: [
          ...dbMatch[0].sources,
          { label: "openFDA Drug Label (FDA)", url: "https://open.fda.gov/data/downloads/" },
          { label: "RxNorm (NIH)", url: "https://rxnav.nlm.nih.gov" },
        ],
      };
      console.log("[ai-search] ✓ Found in built-in DB:", result.brandName);
      return NextResponse.json({ result });
    }

    // Use the distilled token here too — openFDA matches a brand name far
    // better than a full line of OCR'd packaging text.
    const verifiedResult = await identifyFromVerifiedSources({ query: searchKey });
    recordUsage("verified");
    console.log("[ai-search] ✓ Found via verified sources:", verifiedResult.brandName);
    return NextResponse.json({
      result: {
        ...verifiedResult,
        matchNote: `${reason} · ${verifiedResult.matchNote || "matched via openFDA/RxNorm"}`,
      },
    });
  } catch (err) {
    console.error("[ai-search] verified sources fallback also failed:", err);
    return NextResponse.json(
      { error: `Could not identify medicine. ${reason}.` },
      { status: 404 }
    );
  }
}
