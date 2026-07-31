/**
 * Generic-name resolver — the long-tail fallback.
 *
 * The curated Pakistani and Chinese brand tables cover what is commonly
 * dispensed, but no hand-maintained list can cover every brand in either
 * market. This module handles everything else.
 *
 * Two strategies, tried in order:
 *
 *  1. Suffix stripping. Local brands are very often the INN with a marketing
 *     suffix — "Ceftrix" -> cefixime, "Azomax" -> azithromycin. Matching the
 *     query's stem against the RxNorm ingredient list recovers the generic
 *     without anyone having to add a row.
 *
 *  2. RxNorm approximate match. NIH's own spelling-tolerant endpoint, which
 *     handles OCR noise and transliteration ("amoxycillin" -> Amoxicillin,
 *     "paracetmol" -> Acetaminophen).
 *
 * Results are cached in-process; the ingredient list is fetched once and is
 * stable, so repeated lookups cost nothing.
 */

/** Common INN stems. A brand containing one of these very likely IS that drug. */
const INN_STEMS: Array<{ stem: string; generic: string }> = [
  { stem: "cetiriz", generic: "Cetirizine" },
  { stem: "loratad", generic: "Loratadine" },
  { stem: "fexofen", generic: "Fexofenadine" },
  { stem: "montelu", generic: "Montelukast" },
  { stem: "paracet", generic: "Acetaminophen" },
  { stem: "acetamin", generic: "Acetaminophen" },
  { stem: "ibuprof", generic: "Ibuprofen" },
  { stem: "diclofen", generic: "Diclofenac" },
  { stem: "mefenam", generic: "Mefenamic Acid" },
  { stem: "naproxen", generic: "Naproxen" },
  { stem: "celecox", generic: "Celecoxib" },
  { stem: "omepraz", generic: "Omeprazole" },
  { stem: "esomepraz", generic: "Esomeprazole" },
  { stem: "pantopraz", generic: "Pantoprazole" },
  { stem: "lansopraz", generic: "Lansoprazole" },
  { stem: "ranitid", generic: "Ranitidine" },
  { stem: "famotid", generic: "Famotidine" },
  { stem: "domperid", generic: "Domperidone" },
  { stem: "ondanset", generic: "Ondansetron" },
  { stem: "metoclop", generic: "Metoclopramide" },
  { stem: "amoxic", generic: "Amoxicillin" },
  { stem: "amoxyc", generic: "Amoxicillin" },
  { stem: "ampicill", generic: "Ampicillin" },
  { stem: "cefix", generic: "Cefixime" },
  { stem: "ceftri", generic: "Ceftriaxone" },
  { stem: "cefurox", generic: "Cefuroxime" },
  { stem: "cefrad", generic: "Cefradine" },
  { stem: "cephalex", generic: "Cephalexin" },
  { stem: "cefalex", generic: "Cephalexin" },
  { stem: "azithro", generic: "Azithromycin" },
  { stem: "clarithro", generic: "Clarithromycin" },
  { stem: "erythro", generic: "Erythromycin" },
  { stem: "ciproflox", generic: "Ciprofloxacin" },
  { stem: "levoflox", generic: "Levofloxacin" },
  { stem: "moxiflox", generic: "Moxifloxacin" },
  { stem: "doxycyc", generic: "Doxycycline" },
  { stem: "metronid", generic: "Metronidazole" },
  { stem: "fluconaz", generic: "Fluconazole" },
  { stem: "itraconaz", generic: "Itraconazole" },
  { stem: "clotrimaz", generic: "Clotrimazole" },
  { stem: "acyclov", generic: "Acyclovir" },
  { stem: "metform", generic: "Metformin" },
  { stem: "gliclaz", generic: "Gliclazide" },
  { stem: "glimepir", generic: "Glimepiride" },
  { stem: "sitaglip", generic: "Sitagliptin" },
  { stem: "vildaglip", generic: "Vildagliptin" },
  { stem: "empaglif", generic: "Empagliflozin" },
  { stem: "atorvast", generic: "Atorvastatin" },
  { stem: "rosuvast", generic: "Rosuvastatin" },
  { stem: "simvast", generic: "Simvastatin" },
  { stem: "amlodip", generic: "Amlodipine" },
  { stem: "nifedip", generic: "Nifedipine" },
  { stem: "felodip", generic: "Felodipine" },
  { stem: "lisinop", generic: "Lisinopril" },
  { stem: "enalap", generic: "Enalapril" },
  { stem: "perindop", generic: "Perindopril" },
  { stem: "ramipr", generic: "Ramipril" },
  { stem: "losart", generic: "Losartan" },
  { stem: "valsart", generic: "Valsartan" },
  { stem: "telmisart", generic: "Telmisartan" },
  { stem: "bisopro", generic: "Bisoprolol" },
  { stem: "metopro", generic: "Metoprolol" },
  { stem: "atenol", generic: "Atenolol" },
  { stem: "propranol", generic: "Propranolol" },
  { stem: "carvedil", generic: "Carvedilol" },
  { stem: "furosem", generic: "Furosemide" },
  { stem: "hydrochlorothiaz", generic: "Hydrochlorothiazide" },
  { stem: "spironolact", generic: "Spironolactone" },
  { stem: "clopidog", generic: "Clopidogrel" },
  { stem: "warfar", generic: "Warfarin" },
  { stem: "rivarox", generic: "Rivaroxaban" },
  { stem: "salbutam", generic: "Albuterol" },
  { stem: "albuter", generic: "Albuterol" },
  { stem: "salmeter", generic: "Salmeterol" },
  { stem: "budeson", generic: "Budesonide" },
  { stem: "flutica", generic: "Fluticasone" },
  { stem: "predniso", generic: "Prednisolone" },
  { stem: "dexameth", generic: "Dexamethasone" },
  { stem: "methylpred", generic: "Methylprednisolone" },
  { stem: "betameth", generic: "Betamethasone" },
  { stem: "hydrocort", generic: "Hydrocortisone" },
  { stem: "levothyrox", generic: "Levothyroxine" },
  { stem: "tramad", generic: "Tramadol" },
  { stem: "pregabal", generic: "Pregabalin" },
  { stem: "gabapent", generic: "Gabapentin" },
  { stem: "carbamaz", generic: "Carbamazepine" },
  { stem: "valpro", generic: "Valproate" },
  { stem: "levetirac", generic: "Levetiracetam" },
  { stem: "alprazol", generic: "Alprazolam" },
  { stem: "diazep", generic: "Diazepam" },
  { stem: "clonazep", generic: "Clonazepam" },
  { stem: "zolpid", generic: "Zolpidem" },
  { stem: "sertral", generic: "Sertraline" },
  { stem: "fluoxet", generic: "Fluoxetine" },
  { stem: "escitalo", generic: "Escitalopram" },
  { stem: "citalop", generic: "Citalopram" },
  { stem: "risperid", generic: "Risperidone" },
  { stem: "olanzap", generic: "Olanzapine" },
  { stem: "quetiap", generic: "Quetiapine" },
  { stem: "tamsulos", generic: "Tamsulosin" },
  { stem: "sildenaf", generic: "Sildenafil" },
  { stem: "loperam", generic: "Loperamide" },
  { stem: "hyoscine", generic: "Hyoscine Butylbromide" },
  { stem: "ambrox", generic: "Ambroxol" },
  { stem: "acetylcyst", generic: "Acetylcysteine" },
  { stem: "chlorphen", generic: "Chlorpheniramine" },
  { stem: "pseudoephed", generic: "Pseudoephedrine" },
];

const cache = new Map<string, string | null>();

function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Try to recover an INN generic from an arbitrary brand name.
 *
 * Returns null rather than guessing when nothing matches confidently —
 * showing the wrong drug is worse than showing none.
 */
export async function resolveGeneric(query: string): Promise<string | null> {
  const key = norm(query);
  if (key.length < 4) return null;
  if (cache.has(key)) return cache.get(key)!;

  // 1. INN stem match — catches most local brand names cheaply and offline.
  for (const { stem, generic } of INN_STEMS) {
    if (key.includes(stem)) {
      cache.set(key, generic);
      return generic;
    }
  }

  // 2. Bulk index — 22.9k openFDA + RxNorm names. An exact hit means this IS
  //    a real medicine, so hand the canonical spelling to the .gov lookups
  //    rather than whatever the user typed or OCR produced.
  try {
    const { findBulkMedicine } = await import("@/lib/bulk-medicines");
    const hit = findBulkMedicine(query);
    if (hit) {
      cache.set(key, hit.n);
      return hit.n;
    }
  } catch {
    /* index unavailable — fall through */
  }

  // 3. RxNorm approximate match — spelling-tolerant, handles OCR noise.
  try {
    const url =
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json` +
      `?term=${encodeURIComponent(query)}&maxEntries=3&option=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MedSnap/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const json = await res.json();
      const cands = json?.approximateGroup?.candidate || [];
      // Require a strong score; weak matches produce wrong drugs.
      const good = cands.find((c: any) => Number(c.score) >= 50 && c.name);
      if (good?.name) {
        const name = String(good.name).split(/\s+\d/)[0].trim();
        cache.set(key, name);
        return name;
      }
    }
  } catch {
    /* network failure is non-fatal — fall through to null */
  }

  cache.set(key, null);
  return null;
}
