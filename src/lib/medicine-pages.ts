/**
 * Data layer for the statically generated /medicine/[slug] pages.
 *
 * WHY THESE PAGES EXIST
 * ---------------------
 * The app is a client-rendered SPA behind a single "/" route, so search
 * engines had exactly one indexable page. Competing with Drugs.com or WebMD
 * on "pill identifier" is not winnable — they have decades of domain
 * authority.
 *
 * What IS winnable: the ~160 Pakistani (DRAP) and Chinese (NMPA) brands in
 * this codebase are barely covered in English anywhere. "Rigix tablet uses"
 * or "Myteka 10mg" are low-competition queries with real search volume in
 * those markets. One static, server-rendered page per brand turns a 1-page
 * site into a ~160-page site aimed squarely at queries we can rank for.
 *
 * Everything here is derived from the existing curated tables — no new
 * medical claims are invented for SEO purposes.
 */

import { PAKISTAN_BRANDS, type PakBrand } from "@/lib/pakistan-db";
import { CHINA_BRANDS, type CnBrand } from "@/lib/china-db";

export type Region = "pk" | "cn";

export interface MedicinePage {
  slug: string;
  brand: string;
  /** Chinese characters, when the source entry has them. */
  localName?: string;
  aliases: string[];
  generic: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  drugClass?: string;
  usedFor: string[];
  /** Herbal constituents for TCM formulas. */
  composition?: string;
  otc?: boolean;
  tcm?: boolean;
  region: Region;
  regionLabel: string;
  regulator: string;
  regulatorUrl: string;
  /** Other brands of the same molecule, for internal linking. */
  alsoSoldAs: string[];
}

/** URL-safe slug. Stable across builds so links don't rot. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function pakToPage(b: PakBrand, all: PakBrand[]): MedicinePage {
  const key = b.generic.toLowerCase().split(/[+(]/)[0].trim();
  return {
    slug: slugify(b.brand),
    brand: b.brand,
    aliases: b.aliases || [],
    generic: b.generic,
    strength: b.strength,
    form: b.form,
    manufacturer: b.manufacturer,
    drugClass: b.drugClass,
    usedFor: b.usedFor || [],
    otc: b.otc,
    region: "pk",
    regionLabel: "Pakistan",
    regulator: "DRAP — Drug Regulatory Authority of Pakistan",
    regulatorUrl: "https://www.drap.gov.pk",
    alsoSoldAs: all
      .filter(
        (o) =>
          o.brand !== b.brand &&
          o.generic.toLowerCase().split(/[+(]/)[0].trim() === key
      )
      .map((o) => o.brand)
      .slice(0, 8),
  };
}

function cnToPage(b: CnBrand, all: CnBrand[]): MedicinePage {
  const key = (b.generic || "").toLowerCase().split(/[+(]/)[0].trim();
  return {
    slug: slugify(b.brand),
    brand: b.brand,
    localName: b.chinese,
    aliases: b.aliases || [],
    generic: b.generic || "Traditional Chinese Medicine formula",
    strength: b.strength,
    form: b.form,
    manufacturer: b.manufacturer,
    drugClass: b.drugClass,
    usedFor: b.usedFor || [],
    composition: b.composition,
    tcm: b.tcm,
    region: "cn",
    regionLabel: "China",
    regulator: "NMPA — National Medical Products Administration",
    regulatorUrl: "https://english.nmpa.gov.cn",
    alsoSoldAs: key
      ? all
          .filter(
            (o) =>
              o.brand !== b.brand &&
              (o.generic || "").toLowerCase().split(/[+(]/)[0].trim() === key
          )
          .map((o) => o.brand)
          .slice(0, 8)
      : [],
  };
}

let cache: MedicinePage[] | null = null;

/** All medicine pages, deduplicated by slug. */
export function getAllMedicinePages(): MedicinePage[] {
  if (cache) return cache;

  const pages = [
    ...PAKISTAN_BRANDS.map((b) => pakToPage(b, PAKISTAN_BRANDS)),
    ...CHINA_BRANDS.map((b) => cnToPage(b, CHINA_BRANDS)),
  ];

  // Slugs must be unique — two brands could normalise to the same string.
  const seen = new Set<string>();
  cache = pages.filter((p) => {
    if (seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });

  return cache;
}

export function getMedicinePage(slug: string): MedicinePage | null {
  return getAllMedicinePages().find((p) => p.slug === slug) || null;
}

/**
 * Page title. Front-loads the brand and the query pattern people actually
 * type ("<brand> uses"), rather than a generic site name.
 */
export function pageTitle(p: MedicinePage): string {
  const g = p.tcm ? "" : ` (${p.generic})`;
  return `${p.brand}${g} — Uses, Dosage & Side Effects | MedSnap`;
}

export function pageDescription(p: MedicinePage): string {
  const uses = p.usedFor.length
    ? p.usedFor.slice(0, 2).join("; ")
    : `information for ${p.generic}`;
  const strength = p.strength ? ` ${p.strength}` : "";
  return `${p.brand}${strength} — ${p.generic}. Used for: ${uses}. Registered in ${p.regionLabel} (${p.region === "pk" ? "DRAP" : "NMPA"}). Cross-checked with openFDA, RxNorm and DailyMed.`.slice(
    0,
    300
  );
}
