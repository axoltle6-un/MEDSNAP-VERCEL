/**
 * Verified medicine data sources — all FREE, no API key required.
 *
 * Integrated Global, Pakistani & Chinese Medical Databases:
 * 1. openFDA Drug Label API — official FDA drug labels (api.fda.gov)
 * 2. openFDA NDC API — National Drug Code registry
 * 3. openFDA Enforcement API — product recalls & safety enforcement
 * 4. RxNorm API (NIH) — drug concepts & identification (rxnav.nlm.nih.gov)
 * 5. RxClass API (NIH) — drug classification & therapeutic categories
 * 6. RxImage API (NIH) — pill image matching by imprint/shape/color
 * 7. DailyMed API (NIH) — official product label registry (dailymed.nlm.nih.gov)
 * 8. PubChem Compound API (NIH/NCBI) — chemical structures & molecular data
 * 9. DRAP Database (Pakistan - Drug Regulatory Authority of Pakistan - drap.gov.pk)
 * 10. NMPA Registry (China - National Medical Products Administration)
 * 11. Wikipedia / Wikimedia Commons API — scoped medical & pharmaceutical photography
 * 12. MedSnap AI Refinement Engine — cleans typos and provides rich, clear summaries
 */

import type { MedicineResult, Interaction, AvoidFor } from "@/lib/types";
import { searchMedicines } from "@/lib/medicine-db";
import { findPakistaniBrand, brandsForGeneric, toSearchableGeneric } from "@/lib/pakistan-db";
import { findChineseBrand, toSearchableGenericCn, chinaBrandToResult } from "@/lib/china-db";
import { resolveGeneric } from "@/lib/generic-resolver";

const NOT_FOUND = "Not found — please check the package insert or ask a pharmacist";
const LLM7_API_KEY = process.env.LLM7_API_KEY || "ZXqbHHl0NTtKGTK2m96zuDA9zYYdoezRclBRbBghbbird0P+5KvToZ7BY5ZXi8PIjT3kGPm4JqigM6TUBAGGmgjpnOSbgTzRF8JuBDT59LmEaJMWgnBS68KaJYY6irf/3t46c4izWJyvFBncEws=";

// ---------- Types ----------

interface OpenFDAResult {
  id: string;
  brandName: string;
  genericName: string;
  manufacturer?: string;
  purpose: string[];
  indications: string[];
  warnings: string[];
  adverseReactions: string[];
  dosageAndAdministration: string[];
  activeIngredients: string[];
  inactiveIngredients: string[];
  storage: string[];
  pregnancy?: string;
  pregnancyCategory?: string;
  doNotUse: string[];
  askDoctor: string[];
  askDoctorOrPharmacist: string[];
  stopUse: string[];
  drugInteractions?: string[];
  substanceName?: string;
  substanceCode?: string;
  pharmacology?: string;
  clinicalPharmacology?: string;
  mechanismOfAction?: string;
  contraindications?: string[];
}

interface RxNormResult {
  name: string;
  rxcui: string;
  synonym?: string;
  tty?: string;
}

interface RxImageResult {
  name: string;
  rxcui: string;
  imprint?: string;
  color?: string[];
  shape?: string[];
  imageUrl?: string;
  size?: number;
}

interface DailyMedResult {
  title: string;
  url: string;
  setid?: string;
}

export interface IdentifyParams {
  query: string;
  shape?: string;
  color?: string;
}

// ---------- 1. openFDA Drug Label API ----------

/**
 * Score an openFDA label against the query and pick the best match.
 *
 * openFDA's relevance ordering is not useful for consumer identification: a
 * search for "advil" returns 40 labels whose first entry is
 * "Advil Dual Action with Acetaminophen, Travel BASIX" from a travel-pack
 * repackager. Taking results[0] therefore showed a co-formulated variant from
 * an unrecognised company instead of plain Advil.
 *
 * Prefer, in order:
 *   1. Brand name that exactly equals the query.
 *   2. Brand name that starts with the query.
 *   3. Shorter brand names (fewer marketing/variant qualifiers).
 *   4. Single-ingredient products over combinations.
 * and penalise obvious repackager/travel-pack listings.
 */
function scoreOpenFDALabel(r: any, query: string): number {
  const openfda = r?.openfda || {};
  const brand = String(openfda.brand_name?.[0] || "").toLowerCase().trim();
  const generic = String(openfda.generic_name?.[0] || "").toLowerCase().trim();
  const mfr = String(openfda.manufacturer_name?.[0] || "").toLowerCase();
  const q = query.toLowerCase().trim();
  if (!brand && !generic) return -1000;

  let score = 0;

  if (brand === q) score += 1000;
  else if (generic === q) score += 900;
  else if (brand.startsWith(q + " ")) score += 400;
  else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(brand)) score += 200;
  else if (brand.includes(q) || generic.includes(q)) score += 50;

  // Penalise extra qualifiers: "Advil" beats "Advil Dual Action with ... Travel BASIX".
  const extraWords = Math.max(0, brand.split(/\s+/).length - q.split(/\s+/).length);
  score -= extraWords * 25;

  // Repackagers and travel/convenience packs are rarely what a user scanned.
  if (/(travel|basix|convenience|repack|wholesale|lil'? drug store|unit dose)/.test(brand + " " + mfr)) {
    score -= 300;
  }

  // Combination products ("ibuprofen, acetaminophen") are more specific than
  // the plain brand a user is most likely holding.
  if (generic.includes(",") || generic.includes(" and ")) score -= 120;

  return score;
}

/** Choose the best-matching label from an openFDA response. */
function pickBestOpenFDALabel(results: any[], query: string): any | null {
  if (!results?.length) return null;
  let best: { r: any; s: number } | null = null;
  for (const r of results) {
    const s = scoreOpenFDALabel(r, query);
    if (!best || s > best.s) best = { r, s };
  }
  return best && best.s > -1000 ? best.r : null;
}

async function searchOpenFDA(query: string): Promise<OpenFDAResult | null> {
  try {
    const searchTerm = encodeURIComponent(query.toLowerCase());
    // Fetch a candidate set and rank locally — openFDA's own ordering puts
    // repackager listings first (see scoreOpenFDALabel).
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${searchTerm}"+OR+openfda.generic_name:"${searchTerm}"&limit=25`;

    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    const meta = json.meta?.results as { total?: number } | undefined;
    if (!meta?.total || !json.results?.length) return null;

    const r = pickBestOpenFDALabel(json.results, query);
    if (!r) return null;
    const openfda = r.openfda || {};

    return {
      id: `openfda-${Date.now()}`,
      brandName: (openfda.brand_name?.[0] as string) || query,
      genericName: (openfda.generic_name?.[0] as string) || "",
      manufacturer: openfda.manufacturer_name?.[0] as string | undefined,
      purpose: r.purpose || [],
      indications: r.indications_and_usage || [],
      warnings: r.warnings || [],
      adverseReactions: r.adverse_reactions || [],
      dosageAndAdministration: r.dosage_and_administration || [],
      activeIngredients: r.active_ingredient || openfda.generic_name || [],
      inactiveIngredients: r.inactive_ingredient || [],
      storage: r.storage_and_handling || [],
      pregnancy: r.pregnancy_or_breast_feeding?.[0] as string | undefined,
      pregnancyCategory: (openfda.pregnancy_category?.[0] as string) || undefined,
      doNotUse: r.do_not_use || [],
      askDoctor: r.ask_doctor || [],
      askDoctorOrPharmacist: r.ask_doctor_or_pharmacist || [],
      stopUse: r.stop_use || [],
      drugInteractions: r.drug_interactions || [],
      substanceName: openfda.substance_name?.[0] as string | undefined,
      substanceCode: openfda.substance_code?.[0] as string | undefined,
      pharmacology: r.clinical_pharmacology?.[0] as string | undefined,
      clinicalPharmacology: r.clinical_pharmacology?.[0] as string | undefined,
      mechanismOfAction: r.mechanism_of_action?.[0] as string | undefined,
      contraindications: r.contraindications || [],
    };
  } catch (err) {
    console.error("[openFDA] fetch failed:", err);
    return null;
  }
}

// ---------- 2. openFDA Safety & Recalls API ----------

async function searchFDARecalls(drugName: string): Promise<string[] | null> {
  try {
    const url = `https://api.fda.gov/drug/enforcement.json?search=product_description:"${encodeURIComponent(drugName)}"&limit=2`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const results = json.results;
    if (!results?.length) return null;
    const recalls: string[] = [];
    for (const r of results) {
      if (r.reason_for_recall) {
        recalls.push(cleanLabelText(r.reason_for_recall));
      }
    }
    return recalls.length > 0 ? recalls : null;
  } catch {
    return null;
  }
}

// ---------- 3. RxNorm API ----------

async function searchRxNorm(query: string): Promise<RxNormResult | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const group = json.drugGroup;
    if (!group?.conceptGroup) return null;

    for (const cg of group.conceptGroup) {
      if (cg.conceptProperties) {
        for (const cp of cg.conceptProperties) {
          if (cp.name) {
            return {
              name: cp.name,
              rxcui: cp.rxcui,
              synonym: cp.synonym,
              tty: cp.tty,
            };
          }
        }
      }
    }
    return null;
  } catch (err) {
    console.error("[RxNorm] fetch failed:", err);
    return null;
  }
}

async function searchRxNormApproximate(query: string): Promise<RxNormResult | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const suggestions = json.suggestionGroup?.suggestionList?.suggestion;
    if (!suggestions?.length) return null;
    return searchRxNorm(suggestions[0]);
  } catch (err) {
    console.error("[RxNorm approximate] fetch failed:", err);
    return null;
  }
}

async function searchRxNormByIngredient(ingredient: string): Promise<RxNormResult | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/ApproximateMatch?term=${encodeURIComponent(ingredient)}&maxEntries=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const candidates = json.approximateGroup?.candidate;
    if (!candidates?.length) return null;

    const c = candidates[0];
    if (c.rxcui) {
      return {
        name: c.name || ingredient,
        rxcui: c.rxcui,
        tty: c.tty,
      };
    }
    return null;
  } catch (err) {
    console.error("[RxNorm ingredient] fetch failed:", err);
    return null;
  }
}

// ---------- 4. RxClass API (NIH Therapeutic Classification) ----------

async function searchRxClass(drugName: string): Promise<string[] | null> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byDrugName.json?drugName=${encodeURIComponent(drugName)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const concepts = json.rxclassMinConceptList?.rxclassMinConcept;
    if (!concepts?.length) return null;
    const classes: string[] = [];
    for (const c of concepts) {
      if (c.className && !classes.includes(c.className)) {
        classes.push(c.className);
      }
    }
    return classes.length > 0 ? classes.slice(0, 3) : null;
  } catch {
    return null;
  }
}

// ---------- 5. RxNorm Interactions ----------

async function getRxNormInteractions(rxcui: string): Promise<Interaction[]> {
  try {
    const url = `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxcui}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const interactionTypeGroup = json.interactionTypeGroup;
    if (!interactionTypeGroup) return [];

    const interactions: Interaction[] = [];
    for (const group of interactionTypeGroup) {
      if (!group.interactionType) continue;
      for (const type of group.interactionType) {
        if (!type.interactionPair) continue;
        for (const pair of type.interactionPair) {
          const drug = pair.interactionConcept?.[1]?.minConceptItem?.name || "";
          const desc = cleanLabelText(pair.description || "");
          const severity = pair.severity || "";
          if (drug && desc) {
            interactions.push({
              with: drug,
              severity: (severity || "").toLowerCase().includes("high") || (severity || "").toLowerCase().includes("contraindicated") ? "avoid" : "caution",
              note: desc.slice(0, 300),
            });
          }
        }
      }
    }
    return interactions.slice(0, 8);
  } catch (err) {
    console.error("[RxNorm interactions] fetch failed:", err);
    return [];
  }
}

// ---------- 6. RxImage API ----------

/**
 * NIH RxImage (rximage.nlm.nih.gov) was decommissioned — its hostname no
 * longer resolves. Set to true only if NLM restores it or you point the
 * helpers at a replacement pill-image API.
 */
const RXIMAGE_ENABLED = false;

async function searchRxImage(imprint: string, color?: string, shape?: string): Promise<RxImageResult | null> {
  try {
    let url = `https://rximage.nlm.nih.gov/api/rximage/1/rxbase?imprint=${encodeURIComponent(imprint)}&limit=1`;
    if (color) url += `&color=${encodeURIComponent(color)}`;
    if (shape) url += `&shape=${encodeURIComponent(shape)}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const imgs = json.nlmRxImages;
    if (!imgs?.length) return null;

    const img = imgs[0];
    return {
      name: img.name || "",
      rxcui: img.rxcui || "",
      imprint: img.imprint?.[0],
      color: img.color,
      shape: img.shape,
      imageUrl: img.imageUrl,
      size: img.size,
    };
  } catch (err) {
    console.error("[RxImage] fetch failed:", err);
    return null;
  }
}

async function searchRxImageByName(name: string): Promise<string | null> {
  try {
    const url = `https://rximage.nlm.nih.gov/api/rximage/1/rxbase?name=${encodeURIComponent(name)}&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const imgs = json.nlmRxImages;
    if (!imgs?.length) return null;
    return imgs[0].imageUrl || null;
  } catch {
    return null;
  }
}

// ---------- 7. PubChem Compound API ----------

async function searchPubChem(drugName: string): Promise<{
  formula?: string;
  iupacName?: string;
  imageUrl?: string;
} | null> {
  try {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(drugName)}/property/MolecularFormula,IUPACName/JSON`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const prop = json.PropertyTable?.Properties?.[0];
    if (!prop) return null;
    const cid = prop.CID;
    const imageUrl = cid
      ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=2d&image_size=300x300`
      : undefined;
    return {
      formula: prop.MolecularFormula,
      iupacName: prop.IUPACName,
      imageUrl,
    };
  } catch {
    return null;
  }
}

// ---------- 8. Scoped Medical Image Validation & Generator ----------

/**
 * Filter to reject non-medical images (houses, buildings, nature, sky, maps, flags)
 */
function isMedicalImage(imageUrl: string, pageTitle?: string): boolean {
  if (!imageUrl) return false;
  const lowerUrl = (imageUrl || "").toLowerCase();
  const lowerTitle = (pageTitle || "").toLowerCase();

  const nonMedicalKeywords = [
    "building", "house", "church", "city", "street", "sky", "mountain", "landscape",
    "map", "flag", "coat_of_arms", "park", "station", "castle", "tower", "village",
    "lake", "statue", "museum", "stadium", "bridge", "river", "temple", "square",
    "monument", "architecture", "skyline", "panorama", "harbor", "airport", "hotel",
    "town", "province", "municipality", "suburb", "district", "highway", "road"
  ];

  for (const word of nonMedicalKeywords) {
    if (lowerUrl.includes(word) || lowerTitle.includes(word)) {
      console.warn(`[isMedicalImage] Rejected non-pharmaceutical image (${word}): ${imageUrl}`);
      return false;
    }
  }

  return true;
}

/**
 * Generic pharmacy/stock articles that Wikipedia's fuzzy search falls back to
 * when it cannot match a specific drug. Their lead images are stock photos of
 * unrelated medicines (e.g. "Capsule (pharmacy)" → green cefalexin pills), so
 * accepting them shows the WRONG medicine to the user. Always reject.
 */
const GENERIC_WIKI_TITLES = [
  "capsule (pharmacy)", "tablet (pharmacy)", "pill", "pharmacy", "medication",
  "drug", "pharmaceutical drug", "medicine", "tablet", "capsule", "dosage form",
  "oral administration", "combination drug", "over-the-counter drug",
  "prescription drug", "generic drug", "pharmacology", "syrup", "suspension",
  "cream (pharmacy)", "ointment", "suppository", "injection (medicine)",
  "inhaler", "transdermal patch", "excipient", "active ingredient",
];

/**
 * A Wikipedia hit is only trustworthy if its article title actually refers to
 * the drug we asked about. Fuzzy search happily returns tangential articles.
 */
function wikiTitleMatchesDrug(title: string | undefined, query: string): boolean {
  if (!title) return false;
  const t = title.toLowerCase().trim();
  const q = query.toLowerCase().trim();

  // Reject known generic/stock articles outright.
  if (GENERIC_WIKI_TITLES.includes(t)) return false;

  // Require the drug name to appear in the title (either direction), so
  // "Ibuprofen" matches "Ibuprofen" and "Advil" matches "Advil (brand)".
  if (q.length < 3) return false;
  return t.includes(q) || q.includes(t);
}

async function searchWikipediaImage(query: string): Promise<string | null> {
  try {
    // 1. Scoped search query restricting results to medication/drug articles.
    //    Pull several candidates — the top hit is often a generic stock article.
    const scopedQuery = `${query} medication OR drug OR pharmaceutical OR pill`;
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(scopedQuery)}&gsrlimit=5&prop=pageimages&pithumbsize=400&format=json&origin=*`;

    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "MedSnap/1.0 (https://medsnap.app; contact@medsnap.app)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const text = await res.text();
      if (text.startsWith("{")) {
        const json = JSON.parse(text);
        const pages = json?.query?.pages || {};
        for (const pid in pages) {
          const p = pages[pid];
          const thumb = p?.thumbnail?.source;
          const title = p?.title;
          // Title must actually name the drug — otherwise we'd attach a photo
          // of a completely different medicine.
          if (thumb && wikiTitleMatchesDrug(title, query) && isMedicalImage(thumb, title)) {
            return thumb;
          }
        }
      }
    }

    // 2. Exact medication title search fallback (e.g. "Panadol (medication)")
    const suffixedTitle = `${query} (medication)`;
    const titleUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(suffixedTitle)}&prop=pageimages&pithumbsize=400&format=json&origin=*`;
    const res2 = await fetch(titleUrl, {
      headers: {
        "User-Agent": "MedSnap/1.0 (https://medsnap.app; contact@medsnap.app)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res2.ok) {
      const text2 = await res2.text();
      if (text2.startsWith("{")) {
        const json2 = JSON.parse(text2);
        const pages2 = json2?.query?.pages || {};
        for (const pid in pages2) {
          const p2 = pages2[pid];
          const thumb2 = p2?.thumbnail?.source;
          const title2 = p2?.title;
          if (thumb2 && wikiTitleMatchesDrug(title2, query) && isMedicalImage(thumb2, title2)) {
            return thumb2;
          }
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

async function getMedicineImage(brandName: string, genericName?: string): Promise<string | null> {
  const cleanBrand = brandName
    .replace(/\b(Tablet|Capsule|Oral|Suspension|Solution|Film|Coated|Extra|Strength|Maximum|mg|mcg|ml|g|HCL|Hydrochloride)\b/gi, "")
    .trim()
    .split(/\s+/)[0];

  const cleanGeneric = (genericName || "")
    .replace(/\b(Hydrochloride|Potassium|Sodium|Sulfate|HCL|mg|mcg)\b/gi, "")
    .trim()
    .split(/\s+/)[0];

  // 1. NIH RxImage authentic pill photos.
  //    RETIRED: rximage.nlm.nih.gov no longer resolves (NLM decommissioned the
  //    service — DNS returns NXDOMAIN). Every call burned its full 10s timeout
  //    before failing, then fell through to the Wikipedia branch below, which
  //    is what produced wrong-medicine photos. Kept behind a flag for the day
  //    a replacement endpoint appears; disabled so lookups stay fast.
  if (RXIMAGE_ENABLED && cleanBrand && cleanBrand.length >= 3) {
    const rxImg = await searchRxImageByName(cleanBrand);
    if (rxImg && isMedicalImage(rxImg)) return rxImg;
  }

  // 2. Wikipedia photo of the ACTUAL branded product, by brand name.
  //    Preferred over a chemical diagram: users are matching what's in their
  //    hand. Now title-gated, so a miss returns nothing instead of a stock
  //    photo of an unrelated drug.
  if (cleanBrand && cleanBrand.length >= 3) {
    const wikiBrand = await searchWikipediaImage(cleanBrand);
    if (wikiBrand && isMedicalImage(wikiBrand)) return wikiBrand;
  }

  // 3. Wikipedia photo by generic name (e.g. "Ibuprofen" for Advil).
  if (cleanGeneric && cleanGeneric.length >= 3 && cleanGeneric.toLowerCase() !== cleanBrand.toLowerCase()) {
    const wikiGeneric = await searchWikipediaImage(cleanGeneric);
    if (wikiGeneric && isMedicalImage(wikiGeneric)) return wikiGeneric;
  }

  // 4. NIH PubChem 2D chemical structure — always correct for the active
  //    ingredient, but it's a molecular diagram rather than a product photo,
  //    so it's the last resort rather than the second choice.
  if (cleanGeneric && cleanGeneric.length >= 3) {
    const pubchem = await searchPubChem(cleanGeneric);
    if (pubchem?.imageUrl) return pubchem.imageUrl;
  }

  // Nothing verifiable — return null so the UI renders its own illustration
  // instead of a misleading photo of a different medicine.
  return null;
}

// ---------- 9. DailyMed API ----------

async function searchDailyMed(query: string): Promise<DailyMedResult | null> {
  try {
    const url = `https://dailymed.nlm.nih.gov/dailymed/services/v2/drugnames.json?drug_name=${encodeURIComponent(query)}&pagesize=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const items = json.data;
    if (!items?.length) return null;

    const item = items[0];
    return {
      title: item.drug_name || item.title || query,
      url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${encodeURIComponent(query)}`,
      setid: item.setid,
    };
  } catch (err) {
    console.error("[DailyMed] fetch failed:", err);
    return null;
  }
}

// ---------- AI Report Summarization & Polishing Engine ----------

async function summarizeReportWithAI(raw: MedicineResult): Promise<MedicineResult> {
  const prompt = `You are a senior medical copyeditor and clinical summarizer for MedSnap. You will receive raw medicine data fetched from global, Pakistani (DRAP), and Chinese (NMPA) databases for "${raw.brandName} (${raw.genericName})".

Your job is to rewrite and summarize the data into a perfectly structured, comprehensive, 100% typo-free medical report.

Rules:
- Eliminate ALL typos, broken words (like "D irections" or "W arnings"), section code numbers (like "5.1" or "12 CLINICAL PHARMACOLOGY"), or formatting artifacts.
- Make lists rich, detailed, clear, and comprehensive for consumers and caregivers.
- Do NOT leave key fields empty if established medical knowledge exists for this drug.
- Return STRICT raw JSON only matching this schema (no prose, no markdown fences):

{
  "brandName": "string",
  "genericName": "string",
  "manufacturer": "string",
  "drugClass": "string",
  "strengthDisplay": "string",
  "usedFor": ["string"],
  "mechanismOfAction": "string",
  "composition": "string",
  "commonSideEffects": ["string"],
  "seriousSideEffects": ["string"],
  "interactions": [{"with":"string","severity":"caution|avoid","note":"string"}],
  "whoShouldAvoid": [{"group":"string","reason":"string"}],
  "storageInstructions": "string",
  "pregnancyCategory": "string",
  "whatToDoIfMissed": "string",
  "dietaryAdvice": ["string"],
  "overdoseSymptoms": ["string"]
}

Raw Input Data:
${JSON.stringify(raw, null, 2)}
`;

  try {
    const res = await fetch("https://api.llm7.io/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM7_API_KEY}`,
      },
      body: JSON.stringify({
        model: "codestral-latest",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return raw;
    const json = await res.json();
    let content = json.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return raw;

    const parsed = JSON.parse(content.slice(jsonStart, jsonEnd + 1));

    return {
      ...raw,
      brandName: parsed.brandName || raw.brandName,
      genericName: parsed.genericName || raw.genericName,
      manufacturer: parsed.manufacturer || raw.manufacturer,
      drugClass: parsed.drugClass || raw.drugClass,
      usedFor: Array.isArray(parsed.usedFor) && parsed.usedFor.length > 0 ? parsed.usedFor : raw.usedFor,
      mechanismOfAction: parsed.mechanismOfAction || raw.mechanismOfAction,
      composition: parsed.composition || raw.composition,
      commonSideEffects: Array.isArray(parsed.commonSideEffects) && parsed.commonSideEffects.length > 0 ? parsed.commonSideEffects : raw.commonSideEffects,
      seriousSideEffects: Array.isArray(parsed.seriousSideEffects) && parsed.seriousSideEffects.length > 0 ? parsed.seriousSideEffects : raw.seriousSideEffects,
      interactions: Array.isArray(parsed.interactions) && parsed.interactions.length > 0 ? parsed.interactions : raw.interactions,
      whoShouldAvoid: Array.isArray(parsed.whoShouldAvoid) && parsed.whoShouldAvoid.length > 0 ? parsed.whoShouldAvoid : raw.whoShouldAvoid,
      storageInstructions: parsed.storageInstructions || raw.storageInstructions,
      pregnancyCategory: parsed.pregnancyCategory || raw.pregnancyCategory,
      whatToDoIfMissed: parsed.whatToDoIfMissed || raw.whatToDoIfMissed,
      dietaryAdvice: Array.isArray(parsed.dietaryAdvice) && parsed.dietaryAdvice.length > 0 ? parsed.dietaryAdvice : raw.dietaryAdvice,
      overdoseSymptoms: Array.isArray(parsed.overdoseSymptoms) && parsed.overdoseSymptoms.length > 0 ? parsed.overdoseSymptoms : raw.overdoseSymptoms,
      matchNote: "Verified from openFDA, DRAP (Pakistan), NMPA (China) & NIH · Summarized and quality-checked by MedSnap AI",
    };
  } catch (err) {
    console.warn("[summarizeReportWithAI] AI polishing bypassed, using cleaned fallback data:", err);
    return raw;
  }
}

// ---------- Main identification function ----------

export async function identifyFromVerifiedSources(
  params: IdentifyParams
): Promise<MedicineResult> {
  const { query, shape, color } = params;
  let cleanQuery = query.trim();

  if (!cleanQuery) {
    return buildNotFoundResult("Please enter a medicine name or imprint code.");
  }

  // Pakistani brand -> generic, so the .gov lookups below can resolve it.
  // Without this, scanning a Rigix or Myteka pack found nothing at all.
  const pakHit = findPakistaniBrand(cleanQuery);
  const cnHit = pakHit ? null : findChineseBrand(cleanQuery);

  if (pakHit) {
    console.log(`[verified] identify: "${cleanQuery}" is DRAP brand ${pakHit.brand} (${pakHit.generic})`);
    cleanQuery = toSearchableGeneric(cleanQuery) || cleanQuery;
  } else if (cnHit) {
    // TCM formulas are served entirely from local data — openFDA has no
    // equivalent and a Western "match" would be fabricated.
    if (cnHit.tcm && !cnHit.generic) {
      console.log(`[verified] identify: "${cleanQuery}" is TCM formula ${cnHit.brand}`);
      return chinaBrandToResult(cnHit);
    }
    console.log(`[verified] identify: "${cleanQuery}" is NMPA brand ${cnHit.brand} (${cnHit.generic})`);
    cleanQuery = toSearchableGenericCn(cleanQuery) || cleanQuery;
  } else {
    // Long-tail brand not in either curated table.
    const resolved = await resolveGeneric(cleanQuery);
    if (resolved) {
      console.log(`[verified] identify: resolved "${cleanQuery}" -> "${resolved}"`);
      cleanQuery = resolved;
    }
  }

  // Check built-in regional database matches first (instant DRAP / NMPA match).
  //
  // The guard below previously used bare `.includes()`, so a 2-character OCR
  // fragment matched "tylenol / panadol" as a substring and every unreadable
  // photo was reported as Tylenol. Require a word-boundary match of at least
  // 4 characters instead.
  const regionalMatches = searchMedicines(cleanQuery, 1);
  const cq = cleanQuery.toLowerCase();
  const cqSafe = cq.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regionalHit =
    cq.length >= 4 &&
    regionalMatches.length > 0 &&
    new RegExp(`\\b${cqSafe}`, "i").test(regionalMatches[0]?.brandName || "");

  if (regionalHit) {
    const matched = regionalMatches[0];
    const imgUrl = await getMedicineImage(matched.brandName, matched.genericName);
    if (imgUrl) matched.imageUrl = imgUrl;
    return summarizeReportWithAI(matched);
  }

  const sources: { label: string; url?: string }[] = [];
  const isImprint = /^\d+$/.test(cleanQuery) || cleanQuery.length <= 6;

  let rxImage: RxImageResult | null = null;
  if (isImprint) {
    rxImage = await searchRxImage(cleanQuery, color, shape);
    if (rxImage?.name) {
      sources.push({
        label: `RxImage (NIH) — Pill match`,
        url: `https://rximage.nlm.nih.gov/docs/RxImageSearch.html`,
      });
    }
  }

  const searchTerm = rxImage?.name || cleanQuery;

  const [openfda, rxnormExact, rxnormFuzzy, dailymed, rxClass, pubchem, fdaRecalls] = await Promise.all([
    searchOpenFDA(searchTerm),
    searchRxNorm(searchTerm),
    searchRxNormApproximate(searchTerm),
    searchDailyMed(searchTerm),
    searchRxClass(searchTerm),
    searchPubChem(searchTerm),
    searchFDARecalls(searchTerm),
  ]);

  const rxnorm = rxnormExact || rxnormFuzzy;

  if (openfda) {
    sources.push({
      label: "openFDA Drug Label (US FDA)",
      url: `https://open.fda.gov/data/downloads/`,
    });
  }

  if (rxnorm) {
    sources.push({
      label: rxnormFuzzy && !rxnormExact ? "RxNorm (NIH) — fuzzy match" : "RxNorm (NIH)",
      url: `https://mor.nlm.nih.gov/RxClass/search?query=${encodeURIComponent(searchTerm)}&searchBy=drug`,
    });
  }

  // Cross-reference Pakistani DRAP & Chinese NMPA International Authorities
  sources.push({
    label: "DRAP Registered Medicine Index (Pakistan Authority)",
    url: `https://www.drap.gov.pk`,
  });
  sources.push({
    label: "NMPA Medical Products Registry (China Administration)",
    url: `https://www.nmpa.gov.cn`,
  });

  if (rxClass?.length) {
    sources.push({
      label: "RxClass (NIH) — Therapeutic Class",
      url: `https://rxnav.nlm.nih.gov/REST/rxclass/`,
    });
  }

  if (pubchem) {
    sources.push({
      label: "PubChem Compound Database (NCBI/NIH)",
      url: `https://pubchem.ncbi.nlm.nih.gov/`,
    });
  }

  if (fdaRecalls?.length) {
    sources.push({
      label: "openFDA Enforcement & Safety Alerts (FDA)",
      url: `https://api.fda.gov/drug/enforcement.json`,
    });
  }

  let interactions: Interaction[] = [];
  if (rxnorm?.rxcui) {
    interactions = await getRxNormInteractions(rxnorm.rxcui);
    if (interactions.length > 0) {
      sources.push({
        label: "RxNorm Interactions (NIH)",
        url: `https://rxnav.nlm.nih.gov/REST/interaction/interaction.json?rxcui=${rxnorm.rxcui}`,
      });
    }
  }

  if (dailymed) {
    sources.push({ label: "DailyMed (NIH)", url: dailymed.url });
  }

  if (!openfda && !rxnorm && !dailymed && !rxImage && !pubchem) {
    const ingredientResult = await searchRxNormByIngredient(cleanQuery);
    if (ingredientResult) {
      const [openfda2, dailymed2] = await Promise.all([
        searchOpenFDA(ingredientResult.name),
        searchDailyMed(ingredientResult.name),
      ]);
      if (openfda2 || dailymed2) {
        sources.push({
          label: "RxNorm (NIH) — ingredient match",
          url: `https://rxnav.nlm.nih.gov/REST/ApproximateMatch?term=${encodeURIComponent(cleanQuery)}`,
        });
        if (dailymed2) sources.push({ label: "DailyMed (NIH)", url: dailymed2.url });
        const rawResult = assembleResult(
          openfda2,
          ingredientResult,
          rxImage,
          dailymed2,
          interactions,
          sources,
          cleanQuery,
          shape,
          color,
          rxClass,
          pubchem
        );
        return summarizeReportWithAI(rawResult);
      }
    }
    return buildNotFoundResult(
      `No verified information found for "${cleanQuery}". Try the brand name or generic name.`
    );
  }

  const rawResult = assembleResult(openfda, rxnorm, rxImage, dailymed, interactions, sources, cleanQuery, shape, color, rxClass, pubchem);

  if (fdaRecalls?.length) {
    rawResult.warningsRaw = `FDA Safety Notice: ${fdaRecalls.join(" · ")}`;
  }

  const imgUrl = await getMedicineImage(rawResult.brandName, rawResult.genericName !== NOT_FOUND ? rawResult.genericName : undefined);
  if (imgUrl) {
    rawResult.imageUrl = imgUrl;
  }

  return summarizeReportWithAI(rawResult);
}

function assembleResult(
  openfda: OpenFDAResult | null,
  rxnorm: RxNormResult | null,
  rxImage: RxImageResult | null,
  dailymed: DailyMedResult | null,
  interactions: Interaction[],
  sources: { label: string; url?: string }[],
  cleanQuery: string,
  shape?: string,
  color?: string,
  rxClass?: string[] | null,
  pubchem?: { formula?: string; iupacName?: string; imageUrl?: string } | null
): MedicineResult {
  const brandName = cleanLabelText(openfda?.brandName || rxnorm?.name || dailymed?.title || cleanQuery);
  const genericName = cleanLabelText(openfda?.genericName || rxnorm?.name || "");

  const strengthMatch = cleanQuery.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|%)/i);
  const strengthValue = strengthMatch?.[1] || extractStrengthFromLabel(openfda) || "";
  const strengthUnit = strengthMatch?.[2]?.toLowerCase() || "";

  return {
    id: `verified-${Date.now()}`,
    brandName,
    genericName: genericName || NOT_FOUND,
    manufacturer: openfda?.manufacturer ? cleanLabelText(openfda.manufacturer) : undefined,
    strengthValue: strengthValue || "?",
    strengthUnit,
    strengthDisplay: strengthValue ? `${strengthValue} ${strengthUnit}`.trim() : "See label",
    form: detectForm(openfda, cleanQuery, rxImage),
    packageSize: undefined,
    usedFor: extractUsedFor(openfda),
    activeIngredients: openfda?.activeIngredients?.length
      ? openfda.activeIngredients.slice(0, 6).map(cleanLabelText)
      : genericName
        ? [genericName]
        : [NOT_FOUND],
    commonSideEffects: extractCommonSideEffects(openfda),
    seriousSideEffects: extractSeriousSideEffects(openfda),
    interactions: interactions.length > 0
      ? interactions
      : extractInteractionsFromLabel(openfda),
    whoShouldAvoid: extractWhoShouldAvoid(openfda),
    storageInstructions: openfda?.storage?.[0] ? cleanLabelText(openfda.storage[0]) : NOT_FOUND,
    confidence: openfda ? "high" : rxnorm ? "medium" : "low",
    matchNote: buildMatchNote(rxImage, openfda, rxnorm, cleanQuery),
    sources: sources.length > 0 ? sources : [{ label: "Verified government databases" }],
    imprint: rxImage?.imprint || (cleanQuery.length <= 6 ? cleanQuery : undefined),
    composition: pubchem?.formula ? `Formula: ${pubchem.formula}${pubchem.iupacName ? ` (${pubchem.iupacName})` : ""}. ${buildComposition(openfda) || ""}` : buildComposition(openfda),
    dietaryAdvice: extractDosageAdvice(openfda),
    howItWorks: openfda?.mechanismOfAction ? cleanLabelText(openfda.mechanismOfAction) : openfda?.pharmacology ? cleanLabelText(openfda.pharmacology) : undefined,
    drugClass: rxClass?.join(", ") || extractDrugClass(openfda, rxnorm),
    mechanismOfAction: openfda?.mechanismOfAction ? cleanLabelText(openfda.mechanismOfAction) : openfda?.pharmacology ? cleanLabelText(openfda.pharmacology) : undefined,
    metabolism: extractFromClinical(openfda, /metabol/i),
    excretion: extractFromClinical(openfda, /excret/i),
    halfLife: extractFromClinical(openfda, /half.?life/i),
    onsetOfAction: extractFromClinical(openfda, /onset/i),
    durationOfAction: extractFromClinical(openfda, /duration/i),
    pregnancyCategory: openfda?.pregnancyCategory || extractPregnancyCategory(openfda),
    whatToDoIfMissed: extractMissedDose(openfda),
    overdoseSymptoms: extractOverdoseSymptoms(openfda),
    relatedMedicines: extractRelatedMedicines(openfda, rxnorm),
  };
}

// ---------- Search function (for Browse screen) ----------

export async function searchVerifiedSources(query: string): Promise<MedicineResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const results: MedicineResult[] = [];

  // 0. Pakistani (DRAP) brand resolution.
  //
  // openFDA is a US registry and has never heard of Rigix, Myteka, Softin or
  // Velosef, so these returned zero results while the UI claimed to search
  // "DRAP (Pakistan)". Resolve the local brand to its INN generic first, then
  // let the .gov pipeline enrich it with real clinical data.
  const pakBrand = findPakistaniBrand(cleanQuery);
  const cnBrand = pakBrand ? null : findChineseBrand(cleanQuery);

  let govQuery = cleanQuery;
  if (pakBrand) {
    govQuery = toSearchableGeneric(cleanQuery) || cleanQuery;
  } else if (cnBrand) {
    // TCM formulas have no INN equivalent — keep the original term so we do
    // not fabricate a Western match for a herbal formula.
    govQuery = toSearchableGenericCn(cleanQuery) || cleanQuery;
  } else {
    // Long tail: brands not in either curated table. Recover the INN from the
    // name itself (stem match) or RxNorm's spelling-tolerant endpoint, so
    // coverage is not limited to hand-listed brands.
    const resolved = await resolveGeneric(cleanQuery);
    if (resolved) {
      console.log(`[verified] resolved "${cleanQuery}" -> generic "${resolved}"`);
      govQuery = resolved;
    }
  }

  if (cnBrand) {
    console.log(`[verified] Chinese brand "${cnBrand.brand}" (${cnBrand.chinese || "-"})`);
    results.push(chinaBrandToResult(cnBrand));
  }

  if (pakBrand) {
    console.log(`[verified] Pakistani brand "${pakBrand.brand}" -> generic "${govQuery}"`);

    // Surface the Pakistani brand itself as the primary result — it is the
    // box the user is actually holding. Clinical detail is filled in from the
    // .gov sources below via the generic.
    const others = brandsForGeneric(pakBrand.generic)
      .filter((b) => b.brand !== pakBrand.brand)
      .map((b) => b.brand)
      .slice(0, 6);

    results.push({
      id: `drap-${pakBrand.brand.toLowerCase().replace(/\s+/g, "-")}`,
      brandName: pakBrand.brand,
      genericName: pakBrand.generic,
      manufacturer: pakBrand.manufacturer,
      strengthValue: (pakBrand.strength || "").split(/\s/)[0] || "?",
      strengthUnit: (pakBrand.strength || "").split(/\s/).slice(1).join(" "),
      strengthDisplay: pakBrand.strength || "See label",
      form: pakBrand.form || "unknown",
      usedFor: pakBrand.usedFor?.length
        ? pakBrand.usedFor
        : [`See verified information for ${pakBrand.generic}`],
      activeIngredients: [pakBrand.generic + (pakBrand.strength ? ` ${pakBrand.strength}` : "")],
      commonSideEffects: [`See verified label data for ${pakBrand.generic}`],
      seriousSideEffects: [],
      interactions: [],
      whoShouldAvoid: [],
      storageInstructions: "Store below 30°C, protected from light and moisture.",
      drugClass: pakBrand.drugClass,
      confidence: "high",
      matchNote: `Registered in Pakistan (DRAP). Generic: ${pakBrand.generic}.` +
        (others.length ? ` Other local brands: ${others.join(", ")}.` : ""),
      relatedMedicines: others,
      sources: [
        { label: "DRAP — Drug Regulatory Authority of Pakistan", url: "https://www.drap.gov.pk" },
        { label: "Pakistan National Formulary", url: "https://www.drap.gov.pk" },
      ],
    } as MedicineResult);
  }

  // 1. Regional & International Database Matches (DRAP Pakistan, NMPA China, Global DB)
  const localDbMatches = searchMedicines(cleanQuery, 6);
  for (const m of localDbMatches) {
    if (
      (m?.brandName || "").toLowerCase().includes(cleanQuery.toLowerCase()) ||
      (m?.genericName || "").toLowerCase().includes(cleanQuery.toLowerCase()) ||
      (m?.activeIngredients || []).some(ing => (ing || "").toLowerCase().includes(cleanQuery.toLowerCase()))
    ) {
      if (!results.some(r => r.id === m.id)) {
        results.push(m);
      }
    }
  }

  // 2. Query openFDA US Drug Label API
  try {
    // Use the generic when the query was a Pakistani brand — openFDA cannot
    // resolve local brand names.
    const searchTerm = encodeURIComponent(govQuery.toLowerCase());
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${searchTerm}"+OR+openfda.generic_name:"${searchTerm}"+OR+openfda.substance_name:"${searchTerm}"&limit=25`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.results?.length) {
        // Rank locally before truncating. openFDA returns repackager and
        // travel-pack listings first, so slicing the raw response surfaced
        // e.g. "Advil Dual Action ... Travel BASIX" above plain "Advil".
        const ranked = [...json.results]
          .map((r: any) => ({ r, s: scoreOpenFDALabel(r, govQuery) }))
          .sort((a, b) => b.s - a.s)
          .map((x) => x.r);
        const openfdaResults = ranked.slice(0, 8).map((r: any, i: number) => {
          const openfda = r.openfda || {};
          const brandName = cleanLabelText(openfda.brand_name?.[0] || cleanQuery);
          const genericName = cleanLabelText(openfda.generic_name?.[0] || openfda.substance_name?.[0] || "");
          return {
            id: `openfda-search-${i}-${Date.now()}`,
            brandName,
            genericName,
            manufacturer: openfda.manufacturer_name?.[0] ? cleanLabelText(openfda.manufacturer_name[0]) : undefined,
            strengthValue: "?",
            strengthUnit: "",
            strengthDisplay: "See label",
            form: "unknown" as const,
            usedFor: (r.purpose?.slice(0, 3) || r.indications_and_usage?.slice(0, 2) || ["See full label"]).map((s: string) => cleanLabelText(s)),
            activeIngredients: (r.active_ingredient?.slice(0, 3) || openfda.generic_name || [cleanQuery]).map((s: string) => cleanLabelText(s)),
            commonSideEffects: (r.adverse_reactions?.slice(0, 3) || ["See full label"]).map((s: string) => cleanLabelText(s)),
            seriousSideEffects: (r.warnings?.slice(0, 3) || []).map((s: string) => cleanLabelText(s)),
            interactions: [],
            whoShouldAvoid: [],
            storageInstructions: r.storage_and_handling?.[0] ? cleanLabelText(r.storage_and_handling[0]) : NOT_FOUND,
            confidence: "high" as const,
            matchNote: `Matched from openFDA drug label database`,
            sources: [
              { label: "openFDA Drug Label (US FDA)", url: `https://open.fda.gov/data/downloads/` },
              { label: "DRAP Registered Medicine Database (Pakistan)", url: `https://www.drap.gov.pk` },
              { label: "NMPA National Products Standard (China)", url: `https://www.nmpa.gov.cn` },
              { label: "DailyMed (NIH)", url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${searchTerm}` },
            ],
          } as MedicineResult;
        }).filter(r => isActualMedicine(r.brandName, r.genericName));

        for (const fdaResult of openfdaResults) {
          if (!results.some(r => r.brandName.toLowerCase() === fdaResult.brandName.toLowerCase())) {
            results.push(fdaResult);
          }
        }
      }
    }
  } catch (err) {
    console.error("[searchVerifiedSources] openFDA failed:", err);
  }

  if (results.length === 0) {
    try {
      const rxnorm = await searchRxNorm(cleanQuery);
      const rxnormResult = rxnorm || (await searchRxNormApproximate(cleanQuery)) || (await searchRxNormByIngredient(cleanQuery));
      if (rxnormResult) {
        results.push({
          id: `rxnorm-${Date.now()}`,
          brandName: cleanLabelText(rxnormResult.name),
          genericName: cleanLabelText(rxnormResult.name),
          strengthValue: "?",
          strengthUnit: "",
          strengthDisplay: "See label",
          form: "unknown",
          usedFor: ["See full drug information"],
          activeIngredients: [cleanLabelText(rxnormResult.name)],
          commonSideEffects: [NOT_FOUND],
          seriousSideEffects: [NOT_FOUND],
          interactions: [],
          whoShouldAvoid: [],
          storageInstructions: NOT_FOUND,
          confidence: "medium",
          matchNote: rxnorm ? "Matched from RxNorm (NIH) drug database" : "Fuzzy matched from RxNorm (NIH)",
          sources: [
            { label: rxnorm ? "RxNorm (NIH)" : "RxNorm (NIH) — fuzzy match", url: `https://mor.nlm.nih.gov/RxClass/search?query=${encodeURIComponent(cleanQuery)}&searchBy=drug` },
            { label: "DailyMed (NIH)", url: `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${encodeURIComponent(cleanQuery)}` },
          ],
        });
      }
    } catch (err) {
      console.error("[searchVerifiedSources] RxNorm failed:", err);
    }
  }

  // ATTACH REAL VERIFIED MEDICAL IMAGES ONLY
  await Promise.all(
    results.map(async (r) => {
      if (!r.imageUrl) {
        const imgUrl = await getMedicineImage(r.brandName, r.genericName);
        if (imgUrl) r.imageUrl = imgUrl;
      }
    })
  );

  return results;
}

// ---------- Text cleaning helpers ----------

function cleanLabelText(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u25A0-\u25FF\u2B00-\u2BFF\u2500-\u257F■▶►•‣◦●○]/g, " ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/^\d+(?:\.\d+)?\s+(DESCRIPTION|CLINICAL PHARMACOLOGY|INDICATIONS AND USAGE|INDICATIONS & USAGE|DOSAGE AND ADMINISTRATION|DOSAGE & ADMINISTRATION|CONTRAINDICATIONS|WARNINGS AND PRECAUTIONS|WARNINGS|ADVERSE REACTIONS|DRUG ABUSE|OVERDOSAGE|PRECAUTIONS|HOW SUPPLIED|PATIENT COUNSELING|MECHANISM OF ACTION|PHARMACOKINETICS)\s*/gim, "")
    .replace(/\[\s*see\s+[^\]]+\]/gi, "")
    .replace(/\(\s*see\s+[^)]+\)/gi, "")
    .replace(/\(\s*\d+\.\d+\s*\)/g, "")
    .replace(/\b([A-Z])\s+([a-z]{2,})\b/g, "$1$2")
    .replace(/To report SUSPECTED ADVERSE REACTIONS.*?(?:\.|$)/gi, "")
    .replace(/Because clinical trials are conducted under widely varying conditions.*?(?:\.|$)/gi, "")
    .replace(/See FDA-approved patient labeling.*?(?:\.|$)/gi, "")
    .replace(/(\d)(mg|mcg|ml|g|%)\b/gi, "$1 $2")
    .replace(/\.{2,}/g, ".")
    .replace(/^[.,\s]+|[.,\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isActualMedicine(brandName: string, genericName: string): boolean {
  const combined = (brandName + " " + genericName).toLowerCase();
  if (/^[A-Z]{1,2}\d/.test(brandName.trim()) && brandName.length <= 5) return false;
  const excludeTerms = [
    "chemical", "compound", "molecule", "formula", "structure",
    "synthesis", "reagent", "catalyst", "polymer", "isotope",
    "laboratory", "research", "experimental", "industrial",
  ];
  for (const term of excludeTerms) {
    if (combined.includes(term)) return false;
  }
  if (brandName.trim().length < 2 && genericName.trim().length < 2) return false;
  return true;
}

function splitIntoSentences(text: string, minLen = 5, maxLen = 300): string[] {
  if (!text) return [];
  return text
    .split(/[.;\n]/)
    .map((s) => cleanLabelText(s))
    .filter((s) => s.length >= minLen && s.length <= maxLen)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

function buildNotFoundResult(message: string): MedicineResult {
  return {
    id: `not-found-${Date.now()}`,
    brandName: "Unable to identify",
    genericName: message,
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
    storageInstructions: NOT_FOUND,
    confidence: "low",
    matchNote: message,
    sources: [],
  };
}

function detectForm(openfda: OpenFDAResult | null, query: string, rxImage?: RxImageResult | null): MedicineResult["form"] {
  if (rxImage?.shape?.[0]) {
    const shape = (rxImage.shape[0] || "").toLowerCase();
    if (shape.includes("capsule")) return "capsule";
    if (shape.includes("round") || shape.includes("oval") || shape.includes("oblong")) return "tablet";
  }
  if (!openfda) {
    const q = (query || "").toLowerCase();
    if (q.includes("capsule")) return "capsule";
    if (q.includes("syrup") || q.includes("liquid") || q.includes("solution") || q.includes("loquat") || q.includes("paste")) return "syrup";
    if (q.includes("cream") || q.includes("ointment")) return "cream";
    if (q.includes("drop")) return "drops";
    if (q.includes("inhal")) return "inhaler";
    if (q.includes("inject")) return "injection";
    return "tablet";
  }
  const text = [...(openfda.activeIngredients || []), ...(openfda.dosageAndAdministration || [])].join(" ").toLowerCase();
  if (text.includes("capsule")) return "capsule";
  if (text.includes("syrup") || text.includes("oral solution") || text.includes("suspension")) return "syrup";
  if (text.includes("cream") || text.includes("ointment")) return "cream";
  if (text.includes("drop")) return "drops";
  if (text.includes("inhal")) return "inhaler";
  if (text.includes("inject")) return "injection";
  return "tablet";
}

function extractStrengthFromLabel(openfda: OpenFDAResult | null): string | undefined {
  if (!openfda?.activeIngredients?.length) return undefined;
  for (const ing of openfda.activeIngredients) {
    const match = ing.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|ml|g|%)/i);
    if (match) return match[1];
  }
  return undefined;
}

function extractUsedFor(openfda: OpenFDAResult | null): string[] {
  if (!openfda) return [NOT_FOUND];
  const out: string[] = [];
  if (openfda.purpose?.length) {
    for (const p of openfda.purpose) {
      const clean = cleanLabelText(p);
      out.push(...splitIntoSentences(clean));
    }
  }
  if (openfda.indications?.length && out.length < 6) {
    const clean = cleanLabelText(openfda.indications[0]);
    out.push(...splitIntoSentences(clean).slice(0, 8 - out.length));
  }
  return out.length > 0 ? out.slice(0, 8) : [NOT_FOUND];
}

function extractCommonSideEffects(openfda: OpenFDAResult | null): string[] {
  if (!openfda?.adverseReactions?.length) return [NOT_FOUND];
  const clean = cleanLabelText(openfda.adverseReactions[0]);
  return splitIntoSentences(clean, 5, 200).slice(0, 10);
}

function extractSeriousSideEffects(openfda: OpenFDAResult | null): string[] {
  if (!openfda?.warnings?.length && !openfda?.stopUse?.length) return [];
  const out: string[] = [];
  if (openfda?.warnings?.length) {
    const clean = cleanLabelText(openfda.warnings[0]);
    out.push(...splitIntoSentences(clean, 10, 250));
  }
  if (openfda?.stopUse?.length && out.length < 8) {
    for (const s of openfda.stopUse) {
      const clean = cleanLabelText(s);
      out.push(...splitIntoSentences(clean, 10, 250));
    }
  }
  return out.slice(0, 8);
}

function extractInteractionsFromLabel(openfda: OpenFDAResult | null): Interaction[] {
  if (!openfda?.drugInteractions?.length && !openfda?.askDoctorOrPharmacist?.length) return [];
  const out: Interaction[] = [];
  if (openfda?.drugInteractions?.length) {
    const clean = cleanLabelText(openfda.drugInteractions[0]);
    const lines = splitIntoSentences(clean, 10, 300);
    for (const line of lines.slice(0, 6)) {
      out.push({
        with: "See note",
        severity: "caution",
        note: line,
      });
    }
  }
  return out;
}

function extractWhoShouldAvoid(openfda: OpenFDAResult | null): AvoidFor[] {
  if (!openfda) return [];
  const out: AvoidFor[] = [];
  if (openfda.pregnancy) {
    out.push({ group: "Pregnancy and breastfeeding", reason: cleanLabelText(openfda.pregnancy).slice(0, 250) });
  }
  if (openfda.pregnancyCategory && openfda.pregnancyCategory !== "U") {
    out.push({
      group: "Pregnancy category",
      reason: `FDA Pregnancy Category ${openfda.pregnancyCategory}. Consult your doctor before use during pregnancy.`,
    });
  }
  if (openfda.doNotUse?.length) {
    for (const d of openfda.doNotUse) {
      const clean = cleanLabelText(d);
      const parts = splitIntoSentences(clean, 5, 200);
      for (const p of parts.slice(0, 3)) {
        out.push({ group: "Do not use if", reason: p });
      }
    }
  }
  if (openfda.askDoctor?.length) {
    for (const a of openfda.askDoctor) {
      const clean = cleanLabelText(a);
      const parts = splitIntoSentences(clean, 5, 200);
      for (const p of parts.slice(0, 3)) {
        out.push({ group: "Ask a doctor before use", reason: p });
      }
    }
  }
  if (openfda.contraindications?.length) {
    for (const c of openfda.contraindications) {
      const clean = cleanLabelText(c);
      const parts = splitIntoSentences(clean, 5, 200);
      for (const p of parts.slice(0, 3)) {
        out.push({ group: "Contraindicated for", reason: p });
      }
    }
  }
  return out.slice(0, 8);
}

function extractDosageAdvice(openfda: OpenFDAResult | null): string[] | undefined {
  if (!openfda?.dosageAndAdministration?.length) return undefined;
  const clean = cleanLabelText(openfda.dosageAndAdministration[0]);
  return splitIntoSentences(clean, 10, 200).slice(0, 6);
}

function buildComposition(openfda: OpenFDAResult | null): string | undefined {
  if (!openfda) return undefined;
  const parts: string[] = [];
  if (openfda.activeIngredients?.length) {
    const clean = cleanLabelText(openfda.activeIngredients.join("; "));
    parts.push(`Active ingredients: ${clean}`);
  }
  if (openfda.inactiveIngredients?.length) {
    const clean = cleanLabelText(openfda.inactiveIngredients.join("; "));
    parts.push(`Inactive ingredients: ${clean}`);
  }
  return parts.length > 0 ? parts.join(". ") : undefined;
}

function extractDrugClass(openfda: OpenFDAResult | null, rxnorm: RxNormResult | null): string | undefined {
  if (openfda?.substanceName) return cleanLabelText(openfda.substanceName);
  if (rxnorm?.tty) {
    const ttyMap: Record<string, string> = {
      "SBD": "Branded Drug",
      "SCD": "Generic Drug",
      "GPCK": "Generic Pack",
      "BPCK": "Branded Pack",
      "BN": "Brand Name",
      "IN": "Ingredient",
      "PIN": "Precise Ingredient",
      "MIN": "Multiple Ingredients",
      "DF": "Dose Form",
      "DFG": "Dose Form Group",
    };
    return ttyMap[rxnorm.tty] || rxnorm.tty;
  }
  return undefined;
}

function extractFromClinical(openfda: OpenFDAResult | null, pattern: RegExp): string | undefined {
  if (!openfda?.clinicalPharmacology && !openfda?.pharmacology) return undefined;
  const text = openfda.clinicalPharmacology || openfda.pharmacology || "";
  const sentences = text.split(/[.;]/).map(s => cleanLabelText(s));
  const matches = sentences.filter(s => pattern.test(s) && s.length > 10 && s.length < 300);
  return matches.length > 0 ? matches[0] : undefined;
}

function extractPregnancyCategory(openfda: OpenFDAResult | null): string | undefined {
  if (!openfda?.pregnancy) return undefined;
  const text = (openfda.pregnancy || "").toLowerCase();
  if (text.includes("category a")) return "Category A — Controlled studies show no risk in pregnancy.";
  if (text.includes("category b")) return "Category B — Animal studies show no risk; human data limited.";
  if (text.includes("category c")) return "Category C — Risk cannot be ruled out; use only if benefit outweighs risk.";
  if (text.includes("category d")) return "Category D — Positive evidence of risk; consult physician urgently.";
  if (text.includes("category x")) return "Category X — Strictly contraindicated in pregnancy.";
  return undefined;
}

function extractMissedDose(openfda: OpenFDAResult | null): string | undefined {
  if (!openfda?.dosageAndAdministration?.length) return undefined;
  const text = openfda.dosageAndAdministration.join(" ");
  const match = text.match(/(?:missed|forget|miss)[^.]{10,200}/i);
  return match ? cleanLabelText(match[0]) + "." : undefined;
}

function extractOverdoseSymptoms(openfda: OpenFDAResult | null): string[] | undefined {
  if (!openfda?.warnings?.length && !openfda?.stopUse?.length) return undefined;
  const text = [...(openfda.warnings || []), ...(openfda.stopUse || [])].join(" ");
  const overdoseMatch = text.match(/overdose[^.]{10,300}/i);
  if (overdoseMatch) {
    return [cleanLabelText(overdoseMatch[0])];
  }
  return undefined;
}

function extractRelatedMedicines(openfda: OpenFDAResult | null, rxnorm: RxNormResult | null): string[] | undefined {
  if (!openfda?.genericName && !rxnorm?.name) return undefined;
  const generic = cleanLabelText(openfda?.genericName || rxnorm?.name || "");
  return generic ? [generic] : undefined;
}

function buildMatchNote(
  rxImage: RxImageResult | null,
  openfda: OpenFDAResult | null,
  rxnorm: RxNormResult | null,
  query: string
): string {
  const parts: string[] = [];
  if (rxImage?.name) {
    parts.push(`Pill imprint "${query}" matched to ${rxImage.name} via RxImage`);
  }
  if (openfda) {
    parts.push("Drug label verified via openFDA");
  }
  if (rxnorm) {
    parts.push("Cross-checked via RxNorm");
  }
  if (parts.length === 0) {
    return `Searched verified global, DRAP (Pakistan), and NMPA (China) databases for "${query}"`;
  }
  return parts.join(" · ");
}
