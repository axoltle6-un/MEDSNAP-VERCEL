/**
 * Pakistani (DRAP-registered) medicine database.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * The app advertised "DRAP (Pakistan)" as a live data source, but no DRAP
 * lookup ever happened: `verified-sources.ts` merely pushed a static
 * `https://www.drap.gov.pk` link into every result's source list. The actual
 * search hit openFDA, which is a US-only registry — so common Pakistani brands
 * (Rigix, Myteka, Softin, Velosef …) returned zero results while the UI
 * claimed it had searched Pakistani registries.
 *
 * DRAP publishes no public JSON API and its site is not reliably reachable
 * from serverless regions, so a runtime fetch is not an option. This is a
 * curated local dataset of the most commonly dispensed Pakistani brands,
 * keyed to their generics so the existing openFDA/RxNorm/DailyMed pipeline can
 * still enrich them with verified clinical data.
 *
 * Each entry records the brand as sold in Pakistan plus its generic name. The
 * generic is what makes these useful: searching "Rigix" resolves to
 * Cetirizine, which then cross-references cleanly against the .gov sources.
 */

import type { MedicineResult } from "@/lib/types";

export interface PakBrand {
  /** Brand name as printed on the pack. */
  brand: string;
  /** Common alternative spellings / pack variants seen on shelves. */
  aliases?: string[];
  /** INN generic name — the bridge to openFDA / RxNorm. */
  generic: string;
  strength?: string;
  form?: MedicineResult["form"];
  manufacturer?: string;
  /** Short plain-language description of what it treats. */
  usedFor?: string[];
  drugClass?: string;
  /** True when sold without prescription in Pakistan. */
  otc?: boolean;
}

/**
 * Commonly dispensed DRAP-registered brands.
 *
 * Ordered roughly by how often they're encountered in Pakistani pharmacies.
 * Extend freely — `generic` is the only field required for the cross-reference
 * pipeline to work.
 */
export const PAKISTAN_BRANDS: PakBrand[] = [
  // ---- Antihistamines / allergy ----
  { brand: "Rigix", generic: "Cetirizine Hydrochloride", strength: "10 mg", form: "tablet",
    manufacturer: "Sami Pharmaceuticals", drugClass: "Second-generation antihistamine", otc: true,
    usedFor: ["Allergic rhinitis (hay fever)", "Urticaria (hives) and itching", "Watery eyes and sneezing"] },
  { brand: "Zyrtec", generic: "Cetirizine Hydrochloride", strength: "10 mg", form: "tablet",
    manufacturer: "GSK / UCB", drugClass: "Second-generation antihistamine", otc: true },
  { brand: "Softin", generic: "Cetirizine Hydrochloride", strength: "10 mg", form: "tablet",
    manufacturer: "Hilton Pharma", drugClass: "Second-generation antihistamine", otc: true },
  { brand: "Cetrizet", generic: "Cetirizine Hydrochloride", strength: "10 mg", form: "tablet",
    manufacturer: "Zafa Pharmaceutical", drugClass: "Second-generation antihistamine" },
  { brand: "Telfast", generic: "Fexofenadine Hydrochloride", strength: "120 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Second-generation antihistamine" },
  { brand: "Loratin", generic: "Loratadine", strength: "10 mg", form: "tablet",
    manufacturer: "Pharmatec Pakistan", drugClass: "Second-generation antihistamine" },
  { brand: "Avil", generic: "Pheniramine Maleate", strength: "25 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "First-generation antihistamine" },

  // ---- Montelukast (asthma / allergic rhinitis) ----
  { brand: "Myteka", aliases: ["Myteka 10", "Myteka Chewable"], generic: "Montelukast Sodium",
    strength: "10 mg", form: "tablet", manufacturer: "Getz Pharma",
    drugClass: "Leukotriene receptor antagonist",
    usedFor: ["Asthma prophylaxis and long-term control", "Allergic rhinitis", "Exercise-induced bronchoconstriction"] },
  { brand: "Montiget", generic: "Montelukast Sodium", strength: "10 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Leukotriene receptor antagonist" },
  { brand: "Singulair", generic: "Montelukast Sodium", strength: "10 mg", form: "tablet",
    manufacturer: "MSD Pakistan", drugClass: "Leukotriene receptor antagonist" },
  { brand: "Airtek", generic: "Montelukast Sodium", strength: "10 mg", form: "tablet",
    manufacturer: "Sami Pharmaceuticals", drugClass: "Leukotriene receptor antagonist" },

  // ---- Analgesics / antipyretics ----
  { brand: "Panadol", aliases: ["Panadol Extra", "Panadol CF", "Panadol Night"],
    generic: "Paracetamol (Acetaminophen)", strength: "500 mg", form: "tablet",
    manufacturer: "GSK Pakistan / Haleon", drugClass: "Analgesic / antipyretic", otc: true },
  { brand: "Calpol", generic: "Paracetamol (Acetaminophen)", strength: "120 mg/5 ml", form: "syrup",
    manufacturer: "GSK Pakistan", drugClass: "Analgesic / antipyretic", otc: true },
  { brand: "Brufen", generic: "Ibuprofen", strength: "400 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "NSAID", otc: true },
  { brand: "Ponstan", aliases: ["Ponstan Forte"], generic: "Mefenamic Acid", strength: "500 mg",
    form: "tablet", manufacturer: "Pfizer Pakistan", drugClass: "NSAID" },
  { brand: "Arinac", aliases: ["Arinac Forte"], generic: "Ibuprofen + Pseudoephedrine",
    strength: "400 mg / 60 mg", form: "tablet", manufacturer: "Abbott Pakistan",
    drugClass: "NSAID + decongestant" },
  { brand: "Disprin", generic: "Aspirin (Acetylsalicylic Acid)", strength: "300 mg", form: "tablet",
    manufacturer: "Reckitt Benckiser Pakistan", drugClass: "NSAID / antiplatelet", otc: true },
  { brand: "Nuberol", aliases: ["Nuberol Forte"], generic: "Paracetamol + Orphenadrine",
    strength: "650 mg / 50 mg", form: "tablet", manufacturer: "Searle Pakistan",
    drugClass: "Analgesic + muscle relaxant" },

  // ---- Gastro ----
  { brand: "Risek", aliases: ["Risek Insta"], generic: "Omeprazole", strength: "20 mg",
    form: "capsule", manufacturer: "Getz Pharma", drugClass: "Proton pump inhibitor" },
  { brand: "Nexum", aliases: ["Nexum IV"], generic: "Esomeprazole", strength: "40 mg",
    form: "capsule", manufacturer: "Getz Pharma", drugClass: "Proton pump inhibitor" },
  { brand: "Zantac", generic: "Ranitidine", strength: "150 mg", form: "tablet",
    manufacturer: "GSK Pakistan", drugClass: "H2 receptor antagonist" },
  { brand: "Motilium", generic: "Domperidone", strength: "10 mg", form: "tablet",
    manufacturer: "Johnson & Johnson Pakistan", drugClass: "Prokinetic / antiemetic" },
  { brand: "Flagyl", generic: "Metronidazole", strength: "400 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Nitroimidazole antibiotic" },
  { brand: "Entamizole", generic: "Metronidazole + Diloxanide Furoate", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Antiamoebic" },

  // ---- Antibiotics ----
  { brand: "Augmentin", generic: "Amoxicillin + Clavulanic Acid", strength: "625 mg", form: "tablet",
    manufacturer: "GSK Pakistan", drugClass: "Beta-lactam antibiotic" },
  { brand: "Amoxil", generic: "Amoxicillin", strength: "500 mg", form: "capsule",
    manufacturer: "GSK Pakistan", drugClass: "Penicillin antibiotic" },
  { brand: "Velosef", generic: "Cefradine", strength: "500 mg", form: "capsule",
    manufacturer: "Squibb / Bristol-Myers Pakistan", drugClass: "First-generation cephalosporin" },
  { brand: "Ciproxin", generic: "Ciprofloxacin", strength: "500 mg", form: "tablet",
    manufacturer: "Bayer Pakistan", drugClass: "Fluoroquinolone antibiotic" },
  { brand: "Klaricid", generic: "Clarithromycin", strength: "500 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Macrolide antibiotic" },
  { brand: "Azomax", generic: "Azithromycin", strength: "500 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Macrolide antibiotic" },
  { brand: "Cefspan", generic: "Cefixime", strength: "400 mg", form: "capsule",
    manufacturer: "Barrett Hodgson Pakistan", drugClass: "Third-generation cephalosporin" },

  // ---- Cardio / metabolic ----
  { brand: "Glucophage", generic: "Metformin Hydrochloride", strength: "500 mg", form: "tablet",
    manufacturer: "Merck Pakistan", drugClass: "Biguanide antidiabetic" },
  { brand: "Lipiget", generic: "Atorvastatin", strength: "20 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "HMG-CoA reductase inhibitor (statin)" },
  { brand: "Lipitor", generic: "Atorvastatin", strength: "20 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Statin" },
  { brand: "Concor", generic: "Bisoprolol Fumarate", strength: "5 mg", form: "tablet",
    manufacturer: "Merck Pakistan", drugClass: "Beta-blocker" },
  { brand: "Norvasc", generic: "Amlodipine Besylate", strength: "5 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Calcium channel blocker" },
  { brand: "Tenormin", generic: "Atenolol", strength: "50 mg", form: "tablet",
    manufacturer: "AstraZeneca Pakistan", drugClass: "Beta-blocker" },
  { brand: "Cardura", generic: "Doxazosin", strength: "2 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Alpha-blocker" },

  // ---- Respiratory / cough ----
  { brand: "Ventolin", generic: "Salbutamol (Albuterol)", strength: "100 mcg/dose", form: "inhaler",
    manufacturer: "GSK Pakistan", drugClass: "Short-acting beta-2 agonist" },
  { brand: "Hydrillin", generic: "Diphenhydramine + Ammonium Chloride", form: "syrup",
    manufacturer: "Wyeth Pakistan", drugClass: "Antitussive / expectorant" },
  { brand: "Actifed", generic: "Triprolidine + Pseudoephedrine", form: "syrup",
    manufacturer: "GSK Pakistan", drugClass: "Antihistamine + decongestant" },

  // ---- Vitamins / supplements ----
  { brand: "Surbex Z", generic: "Multivitamin + Zinc", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Vitamin supplement", otc: true },
  { brand: "Neurobion", generic: "Vitamin B1 + B6 + B12", form: "tablet",
    manufacturer: "Merck Pakistan", drugClass: "Vitamin B complex", otc: true },
  { brand: "Calcium Sandoz", generic: "Calcium Carbonate + Vitamin D3", form: "tablet",
    manufacturer: "Novartis Pakistan", drugClass: "Mineral supplement", otc: true },
  { brand: "Ferrous Sulphate", aliases: ["Fefol", "Sangobion"], generic: "Ferrous Sulfate",
    form: "capsule", drugClass: "Iron supplement", otc: true },
];

/** Normalise for comparison: lowercase, strip punctuation and extra spaces. */
function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Look up a Pakistani brand by name.
 *
 * Matches the brand itself and its aliases on a word-boundary basis, so a
 * query of "Myteka 10mg" still resolves. Requires >= 3 characters to avoid the
 * substring false-positives that previously made every scan return Tylenol.
 */
export function findPakistaniBrand(query: string): PakBrand | null {
  const q = norm(query);
  if (q.length < 3) return null;

  const tokens = q.split(" ").filter((t) => t.length >= 3);
  const candidates = [q, ...tokens];

  let best: { b: PakBrand; score: number } | null = null;

  for (const b of PAKISTAN_BRANDS) {
    const names = [b.brand, ...(b.aliases || [])].map(norm);
    let score = 0;

    for (const c of candidates) {
      for (const n of names) {
        if (n === c) score = Math.max(score, 100);
        else if (n.startsWith(c + " ") || c.startsWith(n + " ")) score = Math.max(score, 80);
        else if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(n)) {
          score = Math.max(score, 60);
        }
      }
      // Generic name match is weaker but still useful ("cetirizine" -> Rigix).
      if (norm(b.generic).includes(c) && c.length >= 5) score = Math.max(score, 40);
    }

    if (score > 0 && (!best || score > best.score)) best = { b, score };
  }

  return best && best.score >= 40 ? best.b : null;
}

/** All brands sharing a generic — powers "other brands of this medicine". */
export function brandsForGeneric(generic: string): PakBrand[] {
  const g = norm(generic);
  if (!g) return [];
  return PAKISTAN_BRANDS.filter((b) => {
    const bg = norm(b.generic);
    return bg === g || bg.includes(g) || g.includes(bg.split(" ")[0]);
  });
}

/**
 * Best search term for the .gov pipeline.
 *
 * openFDA/RxNorm/DailyMed have never heard of "Rigix", but they know
 * Cetirizine. Translating the brand to its generic is what makes Pakistani
 * medicines resolvable at all.
 */
export function toSearchableGeneric(query: string): string | null {
  const b = findPakistaniBrand(query);
  if (!b) return null;
  // First word of the INN is the most reliable lookup key.
  return b.generic.split(/[+(]/)[0].trim();
}
