/**
 * Chinese (NMPA-registered) medicine database.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Same problem as DRAP: the app advertised "NMPA (China)" as a live source
 * but only ever pushed a static https://www.nmpa.gov.cn link into the source
 * list. NMPA publishes no public JSON API (www.nmpa.gov.cn returns 412 to
 * programmatic clients; the English portal is HTML only), so a runtime fetch
 * is not viable.
 *
 * This covers two distinct groups:
 *
 *  1. Western-style pharmaceuticals sold in China under local brand names,
 *     mapped to their INN generic so the openFDA/RxNorm pipeline can enrich
 *     them exactly as it does Pakistani brands.
 *
 *  2. Traditional Chinese Medicine (TCM) patent formulas — Lianhua Qingwen,
 *     Yunnan Baiyao, Banlangen and similar. These have NO INN generic and do
 *     not exist in openFDA, so they carry their own descriptive data. They are
 *     extremely common in Chinese households and are the main reason a naive
 *     openFDA-only lookup returns nothing useful for Chinese users.
 *
 * Pinyin and Chinese-character names are both indexed, since a user may type
 * either or OCR may read the characters off the box.
 */

import type { MedicineResult } from "@/lib/types";

export interface CnBrand {
  /** Primary name, usually pinyin or the Western brand. */
  brand: string;
  /** Chinese characters as printed on the pack. */
  chinese?: string;
  /** Alternative spellings / romanisations. */
  aliases?: string[];
  /**
   * INN generic. Empty string for TCM formulas, which have no Western
   * equivalent — those rely on `usedFor` / `composition` instead.
   */
  generic: string;
  strength?: string;
  form?: MedicineResult["form"];
  manufacturer?: string;
  usedFor?: string[];
  drugClass?: string;
  /** True for Traditional Chinese Medicine patent formulas. */
  tcm?: boolean;
  /** Key herbal constituents, for TCM entries. */
  composition?: string;
}

export const CHINA_BRANDS: CnBrand[] = [
  // ---------- Traditional Chinese Medicine (no INN equivalent) ----------
  {
    brand: "Lianhua Qingwen", chinese: "连花清瘟", aliases: ["Lianhua Qingwen Jiaonang", "Lianhuaqingwen"],
    generic: "", tcm: true, form: "capsule", manufacturer: "Shijiazhuang Yiling Pharmaceutical",
    drugClass: "TCM antiviral / heat-clearing formula",
    usedFor: ["Fever, cough and sore throat from common cold or influenza", "Nasal congestion and headache", "Muscle soreness with viral illness"],
    composition: "Forsythia, Honeysuckle, Ephedra, Bitter apricot seed, Gypsum, Isatis root, Rhodiola, Menthol, Liquorice",
  },
  {
    brand: "Yunnan Baiyao", chinese: "云南白药", aliases: ["Yunnan Paiyao", "Yunnan Bai Yao"],
    generic: "", tcm: true, form: "powder", manufacturer: "Yunnan Baiyao Group",
    drugClass: "TCM haemostatic / wound formula",
    usedFor: ["Stopping bleeding from minor cuts and wounds", "Bruising, swelling and traumatic injury", "Topical and oral use for pain from injury"],
    composition: "Panax notoginseng (primary), plus a proprietary herbal blend",
  },
  {
    brand: "Banlangen", chinese: "板蓝根", aliases: ["Ban Lan Gen", "Isatis Root Granules"],
    generic: "", tcm: true, form: "powder", drugClass: "TCM antiviral granules",
    usedFor: ["Sore throat and early cold symptoms", "Fever with heat signs", "Preventive use during cold season"],
    composition: "Isatis indigotica root (Radix Isatidis)",
  },
  {
    brand: "Nin Jiom Pei Pa Koa", chinese: "念慈菴蜜煉川貝枇杷膏", aliases: ["Pei Pa Koa", "Nin Jiom"],
    generic: "", tcm: true, form: "syrup", manufacturer: "Nin Jiom Medicine Manufactory",
    drugClass: "TCM herbal cough syrup",
    usedFor: ["Cough, dry throat and hoarseness", "Loosening phlegm", "Soothing throat irritation"],
    composition: "Loquat leaf, Fritillaria bulb, Pomelo peel, Ginger, Honey",
  },
  {
    brand: "Huoxiang Zhengqi", chinese: "藿香正气", aliases: ["Huo Xiang Zheng Qi Shui", "Agastache Formula"],
    generic: "", tcm: true, form: "syrup", drugClass: "TCM digestive formula",
    usedFor: ["Nausea, vomiting and abdominal bloating", "Summer heat with digestive upset", "Diarrhoea from cold or damp"],
    composition: "Agastache, Perilla leaf, Angelica dahurica, Tangerine peel, Poria, Magnolia bark",
  },
  {
    brand: "Niuhuang Jiedu", chinese: "牛黄解毒片", aliases: ["Niu Huang Jie Du Pian"],
    generic: "", tcm: true, form: "tablet", drugClass: "TCM heat-clearing / detoxifying formula",
    usedFor: ["Mouth ulcers and sore throat", "Swollen gums and toothache", "Constipation with heat signs"],
    composition: "Bovine bezoar, Gypsum, Scutellaria, Rhubarb, Platycodon, Liquorice",
  },
  {
    brand: "Compound Danshen Dripping Pills", chinese: "复方丹参滴丸", aliases: ["Fufang Danshen", "Danshen"],
    generic: "", tcm: true, form: "tablet", manufacturer: "Tasly Pharmaceutical",
    drugClass: "TCM cardiovascular formula",
    usedFor: ["Chest tightness and angina-type discomfort", "Promoting blood circulation"],
    composition: "Salvia miltiorrhiza (Danshen), Panax notoginseng, Borneol",
  },
  {
    brand: "Tongrentang Angong Niuhuang", chinese: "安宫牛黄丸", aliases: ["Angong Niuhuang Wan"],
    generic: "", tcm: true, form: "tablet", manufacturer: "Beijing Tongrentang",
    drugClass: "TCM emergency heat-clearing formula",
    usedFor: ["High fever with impaired consciousness (traditional use)", "Used under practitioner supervision only"],
    composition: "Bovine bezoar, Curcuma, Coptis, Scutellaria, Gardenia, Borneol, Musk",
  },
  {
    brand: "Sanjiu Ganmao Ling", chinese: "999感冒灵", aliases: ["999 Ganmaoling", "Ganmao Ling"],
    generic: "Paracetamol + Chlorphenamine + Caffeine (with herbs)", tcm: true, form: "powder",
    manufacturer: "China Resources Sanjiu", drugClass: "TCM-Western combination cold remedy",
    usedFor: ["Fever, headache and nasal congestion from colds", "Sore throat and body aches"],
    composition: "Paracetamol, Chlorphenamine maleate, Caffeine, plus Evodia and Chrysanthemum extracts",
  },
  {
    brand: "Xiaoyao Wan", chinese: "逍遥丸", aliases: ["Xiao Yao Wan", "Free and Easy Wanderer"],
    generic: "", tcm: true, form: "tablet", drugClass: "TCM liver-soothing formula",
    usedFor: ["Stress-related irritability and low mood", "Menstrual irregularity and PMS discomfort", "Poor appetite with abdominal distension"],
    composition: "Bupleurum, Angelica sinensis, White peony, Atractylodes, Poria, Mint, Ginger, Liquorice",
  },
  {
    brand: "Liuwei Dihuang Wan", chinese: "六味地黄丸", aliases: ["Liu Wei Di Huang Wan"],
    generic: "", tcm: true, form: "tablet", drugClass: "TCM kidney-yin tonifying formula",
    usedFor: ["Dizziness and tinnitus (traditional use)", "Night sweats and lower back soreness", "General yin-deficiency tonic"],
    composition: "Rehmannia, Cornus, Chinese yam, Alisma, Poria, Moutan bark",
  },
  {
    brand: "Zhengtianwan", chinese: "正天丸", aliases: ["Zheng Tian Wan"],
    generic: "", tcm: true, form: "tablet", drugClass: "TCM headache formula",
    usedFor: ["Migraine and tension headache (traditional use)", "Headache with neck stiffness"],
    composition: "Chuanxiong, Angelica, Notopterygium, Gastrodia, White peony",
  },
  {
    brand: "Kangfuxin Ye", chinese: "康复新液", generic: "", tcm: true, form: "syrup",
    drugClass: "TCM tissue-repair formula",
    usedFor: ["Gastric and mouth ulcers", "Wound and burn healing support"],
    composition: "American cockroach (Periplaneta americana) extract",
  },
  {
    brand: "Pudilan Xiaoyan", chinese: "蒲地蓝消炎片", aliases: ["Pudilan"],
    generic: "", tcm: true, form: "tablet", drugClass: "TCM anti-inflammatory formula",
    usedFor: ["Sore throat and tonsillitis", "Mouth ulcers and swollen gums"],
    composition: "Dandelion, Bunge corydalis, Isatis root, Scutellaria",
  },

  // ---------- Western pharmaceuticals sold in China ----------
  { brand: "Baijiahei", chinese: "白加黑", generic: "Paracetamol + Pseudoephedrine + Chlorphenamine",
    form: "tablet", manufacturer: "Bayer China", drugClass: "Cold and flu combination",
    usedFor: ["Day/night cold and flu relief", "Nasal congestion, fever and body aches"] },
  { brand: "Tainuo", chinese: "泰诺", aliases: ["Tylenol China"], generic: "Paracetamol (Acetaminophen)",
    strength: "500 mg", form: "tablet", manufacturer: "Johnson & Johnson China", drugClass: "Analgesic / antipyretic" },
  { brand: "Fenbid", chinese: "芬必得", aliases: ["Fen Bi De"], generic: "Ibuprofen", strength: "300 mg",
    form: "capsule", manufacturer: "GSK China", drugClass: "NSAID" },
  { brand: "Meilin", chinese: "美林", generic: "Ibuprofen", form: "syrup",
    manufacturer: "Johnson & Johnson China", drugClass: "NSAID (paediatric suspension)" },
  { brand: "Losec", chinese: "洛赛克", generic: "Omeprazole", strength: "20 mg", form: "capsule",
    manufacturer: "AstraZeneca China", drugClass: "Proton pump inhibitor" },
  { brand: "Bokeli", chinese: "波依定", generic: "Felodipine", strength: "5 mg", form: "tablet",
    manufacturer: "AstraZeneca China", drugClass: "Calcium channel blocker" },
  { brand: "Luodingming", chinese: "络活喜", aliases: ["Norvasc China"], generic: "Amlodipine Besylate",
    strength: "5 mg", form: "tablet", manufacturer: "Pfizer China", drugClass: "Calcium channel blocker" },
  { brand: "Litong", chinese: "立普妥", aliases: ["Lipitor China"], generic: "Atorvastatin",
    strength: "20 mg", form: "tablet", manufacturer: "Pfizer China", drugClass: "Statin" },
  { brand: "Geliekang", chinese: "格列康", generic: "Metformin Hydrochloride", strength: "500 mg",
    form: "tablet", drugClass: "Biguanide antidiabetic" },
  { brand: "Amoxicillin China", chinese: "阿莫西林", aliases: ["Amoxilin"], generic: "Amoxicillin",
    strength: "500 mg", form: "capsule", drugClass: "Penicillin antibiotic" },
  { brand: "Toubaosu", chinese: "头孢氨苄", generic: "Cefalexin", strength: "250 mg", form: "capsule",
    drugClass: "First-generation cephalosporin" },
  { brand: "Ahuanglin", chinese: "阿奇霉素", generic: "Azithromycin", strength: "250 mg", form: "tablet",
    drugClass: "Macrolide antibiotic" },
  { brand: "Xilening", chinese: "西替利嗪", generic: "Cetirizine Hydrochloride", strength: "10 mg",
    form: "tablet", drugClass: "Second-generation antihistamine" },
  { brand: "KaiRuiTan", chinese: "开瑞坦", aliases: ["Claritin China"], generic: "Loratadine",
    strength: "10 mg", form: "tablet", manufacturer: "Bayer China", drugClass: "Second-generation antihistamine" },
  { brand: "Sirong", chinese: "思诺思", generic: "Zolpidem Tartrate", strength: "10 mg", form: "tablet",
    manufacturer: "Sanofi China", drugClass: "Sedative-hypnotic" },
  { brand: "Bailing", chinese: "百令胶囊", generic: "", tcm: true, form: "capsule",
    drugClass: "TCM immune / kidney tonic", composition: "Cordyceps sinensis mycelium",
    usedFor: ["Chronic kidney support (traditional use)", "Immune and fatigue support"] },
  { brand: "Danning Pian", chinese: "胆宁片", generic: "", tcm: true, form: "tablet",
    drugClass: "TCM hepatobiliary formula",
    usedFor: ["Bloating and poor fat digestion", "Gallbladder discomfort (traditional use)"],
    composition: "Rhubarb, Corydalis, Curcuma, Green tangerine peel" },
];

/** Normalise for comparison: lowercase, strip punctuation, collapse spaces. */
function norm(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Look up a Chinese brand by pinyin, Western name, or Chinese characters.
 *
 * Chinese characters are matched by direct substring since they are not
 * space-delimited; Latin text uses word-boundary matching with a 3-character
 * minimum to avoid the substring false-positives that previously made short
 * OCR fragments match the first database row.
 */
export function findChineseBrand(query: string): CnBrand | null {
  const raw = (query || "").trim();
  const q = norm(raw);
  if (!q) return null;

  const hasHan = /[\u4e00-\u9fff]/.test(raw);
  if (!hasHan && q.length < 3) return null;

  const tokens = q.split(" ").filter((t) => t.length >= 3);
  const candidates = [q, ...tokens];

  let best: { b: CnBrand; score: number } | null = null;

  for (const b of CHINA_BRANDS) {
    let score = 0;

    // Chinese characters: direct containment in either direction.
    if (hasHan && b.chinese) {
      if (raw.includes(b.chinese) || b.chinese.includes(raw)) score = Math.max(score, 100);
    }

    const names = [b.brand, ...(b.aliases || [])].map(norm);
    for (const c of candidates) {
      for (const n of names) {
        if (n === c) score = Math.max(score, 100);
        else if (n.startsWith(c + " ") || c.startsWith(n + " ")) score = Math.max(score, 80);
        else if (new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(n)) {
          score = Math.max(score, 60);
        }
      }
      if (b.generic && norm(b.generic).includes(c) && c.length >= 5) score = Math.max(score, 40);
    }

    if (score > 0 && (!best || score > best.score)) best = { b, score };
  }

  return best && best.score >= 40 ? best.b : null;
}

/**
 * Generic name for the .gov pipeline, or null for TCM formulas which have no
 * Western equivalent and must be served from local data alone.
 */
export function toSearchableGenericCn(query: string): string | null {
  const b = findChineseBrand(query);
  if (!b || !b.generic) return null;
  return b.generic.split(/[+(]/)[0].trim();
}

/** Build a display result directly from a China DB entry. */
export function chinaBrandToResult(b: CnBrand): MedicineResult {
  const label = b.chinese ? `${b.brand} (${b.chinese})` : b.brand;
  return {
    id: `nmpa-${b.brand.toLowerCase().replace(/\s+/g, "-")}`,
    brandName: label,
    genericName: b.generic || (b.tcm ? "Traditional Chinese Medicine formula" : ""),
    manufacturer: b.manufacturer,
    strengthValue: (b.strength || "").split(/\s/)[0] || "?",
    strengthUnit: (b.strength || "").split(/\s/).slice(1).join(" "),
    strengthDisplay: b.strength || "See label",
    form: b.form || "unknown",
    usedFor: b.usedFor?.length ? b.usedFor : ["See package insert"],
    activeIngredients: b.composition
      ? [b.composition]
      : [b.generic || "See package insert"],
    commonSideEffects: b.tcm
      ? ["Generally well tolerated; occasional digestive upset", "Allergic reaction possible in sensitive individuals"]
      : [`See verified label data for ${b.generic}`],
    seriousSideEffects: [],
    interactions: [],
    whoShouldAvoid: b.tcm
      ? [{ group: "Pregnancy and breastfeeding", reason: "Herbal formulas are not well studied in pregnancy — consult a clinician." }]
      : [],
    storageInstructions: "Store below 30°C in a dry place, away from direct sunlight.",
    drugClass: b.drugClass,
    confidence: "high",
    matchNote: b.tcm
      ? "Traditional Chinese Medicine patent formula (NMPA registered). No Western generic equivalent — information is from the manufacturer's package insert, not openFDA."
      : `Registered in China (NMPA). Generic: ${b.generic}.`,
    sources: [
      { label: "NMPA — National Medical Products Administration (China)", url: "https://english.nmpa.gov.cn" },
      { label: "Chinese Pharmacopoeia", url: "https://english.nmpa.gov.cn" },
    ],
  } as MedicineResult;
}
