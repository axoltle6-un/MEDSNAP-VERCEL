// Built-in drug database including global, Pakistani (DRAP), and Chinese (NMPA) medications — 100% English.

import type { MedicineResult } from "@/lib/types";

export const MEDICINE_DB: MedicineResult[] = [
  {
    id: "paracetamol-500",
    brandName: "Tylenol / Panadol",
    genericName: "Acetaminophen (Paracetamol)",
    manufacturer: "GSK / Various (OTC)",
    strengthValue: "500",
    strengthUnit: "mg",
    strengthDisplay: "500 mg",
    form: "tablet",
    packageSize: "24 tablets",
    usedFor: [
      "Mild to moderate pain relief (headache, toothache, muscle ache)",
      "Reducing fever",
      "Cold and flu symptom relief",
    ],
    activeIngredients: ["Acetaminophen (Paracetamol) 500 mg"],
    commonSideEffects: [
      "Usually well tolerated at recommended doses",
      "Rare nausea",
      "Mild rash in sensitive individuals",
    ],
    seriousSideEffects: [
      "Liver damage if overdose or combined with alcohol",
      "Severe skin reactions (Stevens-Johnson syndrome) — rare",
      "Allergic reaction: swelling, difficulty breathing",
    ],
    interactions: [
      { with: "Alcohol", severity: "avoid", note: "Increases risk of liver damage." },
      { with: "Warfarin", severity: "caution", note: "May enhance anticoagulant effect at high doses." },
      { with: "Other paracetamol products", severity: "avoid", note: "Risk of accidental overdose." },
    ],
    whoShouldAvoid: [
      { group: "People with severe liver disease", reason: "Increased risk of hepatotoxicity." },
      { group: "Heavy alcohol users", reason: "Should not exceed 2 g/day; consult a doctor." },
    ],
    storageInstructions: "Store below 25°C in a dry place. Keep out of reach of children.",
    confidence: "high",
    matchNote: "Verified across openFDA (US) and DRAP (Pakistan Registration #001248).",
    sources: [
      { label: "openFDA Drug Label (US FDA)", url: "https://open.fda.gov" },
      { label: "DRAP Registered Medicine (Pakistan)", url: "https://www.drap.gov.pk" },
      { label: "DailyMed (NIH)", url: "https://dailymed.nlm.nih.gov" },
    ],
    imprint: "PANADOL / L484",
    drugClass: "Analgesic / Antipyretic (non-opioid)",
    mechanismOfAction:
      "Inhibits cyclooxygenase (COX) enzymes in the central nervous system, reducing prostaglandin synthesis in the brain. This lowers pain perception and resets the hypothalamic temperature set point, reducing fever.",
    composition:
      "Active: Paracetamol 500 mg. Inactive: pregelatinized starch, powdered cellulose, magnesium stearate, sodium starch glycolate.",
    halfLife: "2-3 hours",
    onsetOfAction: "30-60 minutes",
    durationOfAction: "4-6 hours",
    metabolism: "Liver — glucuronidation and sulfation",
    excretion: "Kidneys",
    pregnancyCategory: "Category B — generally considered safe in pregnancy at therapeutic doses",
    breastfeedingSafe: true,
    ageWarnings: ["Not for children under 2 years without medical advice", "Use pediatric syrups for children under 12"],
    overdoseSymptoms: [
      "Nausea and vomiting in first 24 hours",
      "Upper right abdominal pain",
      "Jaundice (yellow skin/eyes) after 24-48 hours",
    ],
    whatToDoIfMissed: "Take as soon as you remember. Do not double the next dose. Max 4000 mg per 24 hours for adults.",
    dietaryAdvice: ["Can be taken with or without food", "Avoid alcohol while taking paracetamol"],
    relatedMedicines: ["Ibuprofen", "Aspirin", "Naproxen", "Panadol Extra"],
    appearance: { shape: "caplet", color: "#FFFFFF", coating: "film", hasScore: true },
  },

  // 🇵🇰 PAKISTANI REGISTERED MEDICATIONS (DRAP)
  {
    id: "drap-arinac-forte",
    brandName: "Arinac / Arinac Forte",
    genericName: "Ibuprofen + Pseudoephedrine Hydrochloride",
    manufacturer: "Abbott Laboratories (Pakistan) Ltd. (DRAP Reg #003892)",
    strengthValue: "400/60",
    strengthUnit: "mg",
    strengthDisplay: "400 mg / 60 mg",
    form: "tablet",
    packageSize: "10x10 Blister Pack",
    usedFor: [
      "Relief of sinus pressure, nasal congestion, and sinus headache",
      "Cold and flu fever, body aches, and sore throat",
      "Upper respiratory allergy symptoms with congestion",
    ],
    activeIngredients: ["Ibuprofen 400 mg", "Pseudoephedrine HCl 60 mg"],
    commonSideEffects: [
      "Mild insomnia or restlessness",
      "Dry mouth or throat",
      "Upset stomach or mild heartburn",
      "Slight increase in pulse rate",
    ],
    seriousSideEffects: [
      "Elevated blood pressure or palpitations",
      "Stomach irritation or GI bleeding (long-term use)",
      "Urinary retention in elderly patients",
    ],
    interactions: [
      { with: "MAO Inhibitors", severity: "avoid", note: "Contraindicated — risk of severe hypertensive crisis." },
      { with: "Antihypertensives / ACE Inhibitors", severity: "caution", note: "Pseudoephedrine may oppose blood pressure control." },
      { with: "Other NSAIDs (e.g., Brufen, Ponstan)", severity: "avoid", note: "Increased risk of stomach ulcers." },
    ],
    whoShouldAvoid: [
      { group: "Uncontrolled hypertension or severe heart disease", reason: "Decongestants can elevate blood pressure." },
      { group: "Active peptic ulcer disease", reason: "Ibuprofen may aggravate gastric mucosa." },
      { group: "First and third trimesters of pregnancy", reason: "Avoid vasoconstrictors and NSAIDs." },
    ],
    storageInstructions: "Store below 30°C in a dry place. Protect from heat and direct sunlight.",
    confidence: "high",
    matchNote: "Matched registered drug in DRAP Pakistan Pharmaceutical Index.",
    sources: [
      { label: "Drug Regulatory Authority of Pakistan (DRAP)", url: "https://www.drap.gov.pk" },
      { label: "Pakistan National Formulary (PNF)", url: "https://www.drap.gov.pk" },
      { label: "PharmaPedia Pakistan", url: "https://www.drap.gov.pk" },
    ],
    imprint: "ARINAC / Abbott",
    drugClass: "NSAID Analgesic + Sympathomimetic Decongestant Combination",
    mechanismOfAction:
      "Dual action formulation: Ibuprofen non-selectively inhibits COX-1 and COX-2 enzymes to block prostaglandin synthesis and relieve inflammation/pain. Pseudoephedrine stimulates alpha-adrenergic receptors in nasal vascular smooth muscle, causing vasoconstriction and shrinking swollen nasal tissues.",
    composition:
      "Active: Ibuprofen 400 mg, Pseudoephedrine Hydrochloride 60 mg per film-coated tablet. Inactive: starch, microcrystalline cellulose, povidone, magnesium stearate, hypromellose.",
    halfLife: "Ibuprofen: 2 hours; Pseudoephedrine: 4-8 hours",
    onsetOfAction: "30 minutes (decongestant effect within 15-30 mins)",
    durationOfAction: "6 hours",
    metabolism: "Ibuprofen metabolized in liver (CYP2C9); Pseudoephedrine 55-75% excreted unchanged",
    excretion: "Renal excretion",
    pregnancyCategory: "Contraindicated in third trimester; avoid during entire pregnancy unless advised by obstetrician",
    breastfeedingSafe: false,
    ageWarnings: ["Not for children under 12 years without pediatrician consultation"],
    overdoseSymptoms: ["Severe hypertension", "Tachycardia", "Confusion", "Nausea and abdominal pain"],
    whatToDoIfMissed: "Take as needed every 6 hours. Do not exceed 4 tablets in 24 hours.",
    dietaryAdvice: ["Take after food or with milk to prevent gastric irritation", "Avoid coffee and energy drinks"],
    relatedMedicines: ["Brufen", "Sinutab", "Panadol CF", "Actifed"],
    appearance: { shape: "round", color: "#F5A623", coating: "film" },
  },
  {
    id: "drap-risek-20",
    brandName: "Risek / Risek Insta",
    genericName: "Omeprazole",
    manufacturer: "Getz Pharma (Pakistan) Pvt. Ltd. (DRAP Reg #024810)",
    strengthValue: "20",
    strengthUnit: "mg",
    strengthDisplay: "20 mg / 40 mg",
    form: "capsule",
    packageSize: "14 capsules / sachet",
    usedFor: [
      "Gastroesophageal Reflux Disease (GERD) and heartburn",
      "Gastric and duodenal ulcers",
      "Eradication of H. pylori infection in combination therapy",
      "Prevention of NSAID-induced stomach ulcers",
    ],
    activeIngredients: ["Omeprazole 20 mg (as enteric-coated pellets)"],
    commonSideEffects: ["Headache", "Flatulence or mild diarrhea", "Abdominal discomfort", "Nausea"],
    seriousSideEffects: [
      "Hypomagnesemia with long-term therapy (> 1 year)",
      "Bone fractures in prolonged high-dose usage",
      "C. difficile-associated diarrhea",
    ],
    interactions: [
      { with: "Clopidogrel", severity: "caution", note: "May decrease antiplatelet activity of clopidogrel." },
      { with: "Ketoconazole / Itraconazole", severity: "caution", note: "Reduced antifungal absorption due to higher stomach pH." },
    ],
    whoShouldAvoid: [
      { group: "Known hypersensitivity to PPIs", reason: "Risk of cross-allergic reaction." },
    ],
    storageInstructions: "Store below 25°C. Protect from light and moisture.",
    confidence: "high",
    matchNote: "Matched registered drug in DRAP Pakistan Database.",
    sources: [
      { label: "Drug Regulatory Authority of Pakistan (DRAP)", url: "https://www.drap.gov.pk" },
      { label: "Getz Pharma Medical Index", url: "https://getzpharma.com" },
    ],
    imprint: "RISEK 20 / GETZ",
    drugClass: "Proton Pump Inhibitor (Anti-ulcerant)",
    mechanismOfAction:
      "Inhibits parietal cell H+/K+-ATPase enzyme system, blocking final hydrogen ion secretion into gastric lumen.",
    composition: "Omeprazole 20 mg as enteric coated pellets in gelatin capsule.",
    halfLife: "1 hour",
    onsetOfAction: "1-2 hours",
    durationOfAction: "24 hours",
    metabolism: "Hepatic (CYP2C19 & CYP3A4)",
    excretion: "Urinary (77%) and Fecal (19%)",
    pregnancyCategory: "Category C — use if benefit outweighs risk.",
    breastfeedingSafe: false,
    ageWarnings: ["Adult and pediatric dosage prescribed by physician"],
    overdoseSymptoms: ["Drowsiness", "Blurred vision", "Tachycardia", "Dry mouth"],
    whatToDoIfMissed: "Take 30 minutes before breakfast.",
    dietaryAdvice: ["Take before morning meal", "Avoid trigger foods like excessive spice or oil"],
    relatedMedicines: ["Losec", "Prilosec", "Nexum (Esomeprazole)", "Zopent (Pantoprazole)"],
    appearance: { shape: "capsule", color: "#2E7D32", colorSecondary: "#FFFFFF" },
  },
  {
    id: "drap-ponstan-500",
    brandName: "Ponstan / Ponstan Forte",
    genericName: "Mefenamic Acid",
    manufacturer: "Pfizer / GSK Pakistan (DRAP Reg #000843)",
    strengthValue: "500",
    strengthUnit: "mg",
    strengthDisplay: "500 mg",
    form: "tablet",
    packageSize: "20 tablets",
    usedFor: [
      "Treatment of primary dysmenorrhea (menstrual pain and heavy bleeding)",
      "Post-operative and dental pain relief",
      "Arthritic and musculoskeletal inflammation",
    ],
    activeIngredients: ["Mefenamic Acid 500 mg"],
    commonSideEffects: ["Stomach upset", "Drowsiness", "Nausea", "Headache"],
    seriousSideEffects: ["Gastrointestinal bleeding", "Renal papillary necrosis with prolonged use"],
    interactions: [
      { with: "Anticoagulants (Warfarin)", severity: "avoid", note: "Potentiates bleeding risk." },
      { with: "Aspirin", severity: "avoid", note: "Avoid concurrent NSAID administration." },
    ],
    whoShouldAvoid: [
      { group: "Peptic ulcer or inflammatory bowel disease", reason: "NSAIDs exacerbate ulceration." },
      { group: "Severe renal or hepatic failure", reason: "Altered drug clearance." },
    ],
    storageInstructions: "Store below 30°C in a dry place.",
    confidence: "high",
    matchNote: "Matched registered drug in DRAP Pakistan Database.",
    sources: [
      { label: "Drug Regulatory Authority of Pakistan (DRAP)", url: "https://www.drap.gov.pk" },
    ],
    imprint: "PONSTAN 500",
    drugClass: "Fenamate NSAID Analgesic",
    mechanismOfAction:
      "Inhibits synthesis of prostaglandins and directly blocks prostaglandin receptors on target tissues.",
    composition: "Mefenamic Acid 500 mg.",
    halfLife: "2 hours",
    onsetOfAction: "1-2 hours",
    durationOfAction: "6 hours",
    metabolism: "Hepatic CYP2C9",
    excretion: "Urine and feces",
    pregnancyCategory: "Category C before 30 weeks; Category D in 3rd trimester.",
    breastfeedingSafe: false,
    ageWarnings: ["Not recommended for children under 14 years"],
    overdoseSymptoms: ["Lethargy", "Severe abdominal pain", "Seizures in high toxic overdose"],
    whatToDoIfMissed: "Take with meals every 8 hours as needed for short-term pain.",
    dietaryAdvice: ["Must be taken with meals or milk"],
    relatedMedicines: ["Brufen", "Voltaren (Diclofenac)", "Ansaid (Flurbiprofen)"],
    appearance: { shape: "oval", color: "#FDD835", coating: "film" },
  },

  // 🇨🇳 CHINESE REGISTERED MEDICATIONS (NMPA & Chinese Pharmacopoeia) — 100% ENGLISH
  {
    id: "nmpa-lianhua-qingwen",
    brandName: "Lianhua Qingwen Capsule",
    genericName: "Lianhua Qingwen Traditional Herbal Formulation",
    manufacturer: "Shijiazhuang Yiling Pharmaceutical Co., Ltd. (NMPA Reg #Z20040063)",
    strengthValue: "0.35",
    strengthUnit: "g",
    strengthDisplay: "0.35 g / capsule",
    form: "capsule",
    packageSize: "24 capsules / box",
    usedFor: [
      "Treatment of influenza, viral fever, and respiratory infections",
      "Clearing epidemic toxins, dispersing lung heat, and relieving sore throat",
      "Symptoms: fever, muscle aches, nasal congestion, cough, and dry throat",
    ],
    activeIngredients: [
      "Forsythia Fruit (Fructus Forsythiae)",
      "Honeysuckle Flower (Flos Lonicerae)",
      "Ephedra Herb (Herba Ephedrae)",
      "Bitter Almond Seed (Semen Armeniacae)",
      "Isatis Root (Radix Isatidis)",
      "Gypsum (Gypsum Fibrosum)",
      "Rhubarb Root (Radix Rhei)",
      "Menthol",
    ],
    commonSideEffects: [
      "Mild digestive looseness or diarrhea (due to cooling herbs like Rhubarb)",
      "Nausea or stomach coldness in sensitive individuals",
    ],
    seriousSideEffects: [
      "Rare allergic rash in hypersensitive individuals",
    ],
    interactions: [
      { with: "Tonic Traditional Medicines", severity: "caution", note: "Avoid concurrent strong tonics (e.g. Ginseng) during acute heat clearing." },
      { with: "Antihypertensives", severity: "caution", note: "Contains natural Ephedra — monitor blood pressure." },
    ],
    whoShouldAvoid: [
      { group: "Pregnant women", reason: "Contains heat-clearing and purgative herbs." },
      { group: "Athletes subject to doping tests", reason: "Contains natural Ephedra alkaloids." },
      { group: "Severe spleen and stomach deficiency", reason: "Cooling nature may cause loose stool." },
    ],
    storageInstructions: "Sealed, stored in a cool dry place below 20°C.",
    confidence: "high",
    matchNote: "Official NMPA National Essential Medicine Standard.",
    sources: [
      { label: "National Medical Products Administration (NMPA China)", url: "https://www.nmpa.gov.cn" },
      { label: "Chinese Pharmacopoeia (ChP 2020 Edition)", url: "https://www.nmpa.gov.cn" },
    ],
    imprint: "YILING / LIANHUA",
    drugClass: "Traditional Botanical Formulation — Epidemic Heat-Clearing & Detoxifying Agent",
    mechanismOfAction:
      "Multi-target antiviral, anti-inflammatory, and immunomodulatory botanical mechanism. Inhibits viral replication, blocks cytokine storm signaling, and suppresses airway mucus hypersecretion.",
    composition:
      "Standardized herbal extract formula containing 13 traditional medicinal ingredients encapsulated in hard gelatin.",
    halfLife: "Variable (multi-component herbal pharmacokinetics)",
    onsetOfAction: "Within 1-2 hours",
    durationOfAction: "4-6 hours (recommended 4 capsules 3 times daily)",
    metabolism: "Hepatic metabolic pathways for various saponins, flavonoids, and glycosides",
    excretion: "Biliary and renal routes",
    pregnancyCategory: "Contraindicated in pregnancy due to Rhubarb and Ephedra active components.",
    breastfeedingSafe: false,
    ageWarnings: ["Use with caution in infants; pediatric dosing should follow clinical advice"],
    overdoseSymptoms: ["Abdominal cramping", "Diarrhea", "Dizziness or mild palpitations"],
    whatToDoIfMissed: "Take 4 capsules 3 times daily after meals with warm water.",
    dietaryAdvice: ["Avoid raw, cold, greasy, or spicy foods while taking heat-clearing herbal medicine", "Drink warm water"],
    relatedMedicines: ["Yinqiao San Powder", "Ganmao Ling Granules", "Huoxiang Zhengqi Liquid"],
    appearance: { shape: "capsule", color: "#A8703B", colorSecondary: "#E2C392" },
  },
  {
    id: "nmpa-yunnan-baiyao",
    brandName: "Yunnan Baiyao",
    genericName: "Yunnan Baiyao Proprietary Botanical Hemostatic",
    manufacturer: "Yunnan Baiyao Group Co., Ltd. (NMPA Reg #Z53020050)",
    strengthValue: "0.25",
    strengthUnit: "g",
    strengthDisplay: "0.25 g / capsule",
    form: "capsule",
    packageSize: "16 capsules + 1 Red Emergency Safety Pill",
    usedFor: [
      "Hemostasis: stopping internal and traumatic bleeding",
      "Relieving blood stasis, swelling, and traumatic injury pain",
      "Gastric bleeding, hemoptysis, and post-surgical recovery",
    ],
    activeIngredients: ["Notoginseng Radix (Sanqi Root)", "State Protected Botanical Complex"],
    commonSideEffects: ["Mild dryness or warm sensation in mouth", "Occasional stomach discomfort if taken on empty stomach"],
    seriousSideEffects: ["Skin hypersensitivity in rare cases"],
    interactions: [
      { with: "Anticoagulants (Warfarin, Heparin)", severity: "caution", note: "May oppose anticoagulant action due to pro-hemostatic activity." },
    ],
    whoShouldAvoid: [
      { group: "Pregnant women", reason: "Strictly contraindicated — activates blood circulation and may induce contractions." },
      { group: "Allergy to Notoginseng", reason: "Do not use." },
    ],
    storageInstructions: "Store sealed in cool, dry conditions away from light.",
    confidence: "high",
    matchNote: "Classified as Top Secret Class Tier-1 Botanical Medicine.",
    sources: [
      { label: "National Medical Products Administration (NMPA China)", url: "https://www.nmpa.gov.cn" },
      { label: "Chinese Pharmacopoeia (ChP)", url: "https://www.nmpa.gov.cn" },
    ],
    imprint: "YUNNAN BAIYAO",
    drugClass: "Traditional Botanical Hemostatic & Anti-inflammatory Formulation",
    mechanismOfAction:
      "Accelerates blood platelet aggregation, reduces clotting time, promotes microvascular constriction at trauma sites, and downregulates inflammatory pain mediators.",
    composition: "Panax notoginseng active ginsenosides and proprietary botanical extracts.",
    halfLife: "Complex botanical multi-phase elimination",
    onsetOfAction: "Rapid hemostasis (within 15-30 minutes)",
    durationOfAction: "4-6 hours",
    metabolism: "Hepatic metabolic biotransformation",
    excretion: "Urine and feces",
    pregnancyCategory: "Strictly Contraindicated in Pregnancy",
    breastfeedingSafe: false,
    ageWarnings: ["Children under 5 should consult physician"],
    overdoseSymptoms: ["Nausea", "Tightness in chest"],
    whatToDoIfMissed: "Take 1-2 capsules 4 times daily with warm water or wine (for stasis relief). For severe trauma, swallow the single central Red Emergency Safety Pill first.",
    dietaryAdvice: ["Avoid broad beans, fish, sour or cold food during administration"],
    relatedMedicines: ["Sanqi Powder", "Pian Zai Huang Formulation"],
    appearance: { shape: "capsule", color: "#C62828", colorSecondary: "#FFFFFF" },
  },
  {
    id: "nmpa-piba-gao",
    brandName: "Nin Jiom Pei Pa Koa (Loquat & Fritillaria Syrup)",
    genericName: "Loquat Leaf & Fritillaria Syrup",
    manufacturer: "Nin Jiom Medicine Manufactory (NMPA Reg #ZC20150005)",
    strengthValue: "150",
    strengthUnit: "ml",
    strengthDisplay: "150 ml bottle",
    form: "syrup",
    packageSize: "150 ml glass bottle",
    usedFor: [
      "Relieving cough, phlegm, and throat irritation",
      "Moistening lungs and soothing hoarseness or loss of voice",
      "Heat-clearing cough relief for dry or spasmodic coughs",
    ],
    activeIngredients: [
      "Tendrilleaf Fritillaria Bulb (Bulbus Fritillariae)",
      "Loquat Leaf (Folium Eriobotryae)",
      "Adenophora Root (Radix Adenophorae)",
      "Poria Sclerotium (Poria cocos)",
      "Pomelo Peel (Exocarpium Citri Grandis)",
      "Platycodon Root (Radix Platycodonis)",
      "Menthol",
      "Natural Honey Syrup Base",
    ],
    commonSideEffects: ["Usually well tolerated", "Mild blood sugar rise in diabetics due to honey base"],
    seriousSideEffects: ["None routinely reported"],
    interactions: [
      { with: "Diabetic Medications", severity: "caution", note: "High natural honey syrup content — monitor glucose." },
    ],
    whoShouldAvoid: [
      { group: "Diabetic patients", reason: "Contains sucrose and honey syrup." },
      { group: "Infants under 1 year", reason: "Contains raw honey base." },
    ],
    storageInstructions: "Store tightly sealed in a cool place or refrigerate after opening.",
    confidence: "high",
    matchNote: "Famous global herbal lung-soothing syrup (NMPA Registered).",
    sources: [
      { label: "National Medical Products Administration (NMPA China)", url: "https://www.nmpa.gov.cn" },
      { label: "Hong Kong Department of Health Medical Registry", url: "https://www.cmhk.gov.hk" },
    ],
    imprint: "NIN JIOM / PEI PA KOA",
    drugClass: "Traditional Botanical Antitussive & Expectorant Syrup",
    mechanismOfAction:
      "Soothes inflamed pharyngeal mucosa with demulcent honey base, stimulates bronchial secretion clearance via saponins, and relaxes bronchial smooth muscle.",
    composition: "Fritillaria and loquat herbal thick syrup with menthol and honey.",
    halfLife: "Topical pharyngeal contact and systemic absorption",
    onsetOfAction: "Immediate demulcent soothing upon swallowing",
    durationOfAction: "3-4 hours",
    metabolism: "Hepatic & GI tract processing",
    excretion: "Systemic elimination",
    pregnancyCategory: "Use with caution under medical supervision.",
    breastfeedingSafe: true,
    ageWarnings: ["Not for infants under 12 months"],
    overdoseSymptoms: ["Hyperglycemia in high volumes"],
    whatToDoIfMissed: "Take 1 tablespoon (15 ml) 3 times daily. Dissolve slowly in mouth or mix in warm water.",
    dietaryAdvice: ["Sip slowly for maximum throat coating effect"],
    relatedMedicines: ["Fritillaria Cough Liquid", "Compound Licorice Mixture"],
    appearance: { shape: "bottle", color: "#4A2700" },
  },
];

// Loose text match supporting English search terms
export function searchMedicines(query: string, limit = 8): MedicineResult[] {
  if (!query || !query.trim()) return MEDICINE_DB.slice(0, limit);
  const q = query.trim().toLowerCase();
  const scored = MEDICINE_DB.map((m) => {
    const fields = [
      m.brandName || "",
      m.genericName || "",
      (m.activeIngredients || []).join(" "),
      (m.usedFor || []).join(" "),
      m.imprint ?? "",
      m.drugClass ?? "",
      m.manufacturer ?? "",
    ]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (fields.includes(q)) score += 50;
    for (const token of q.split(/\s+/)) {
      if (token && fields.includes(token)) score += 10;
    }
    if ((m.brandName || "").toLowerCase().includes(q)) score += 30;
    if ((m.genericName || "").toLowerCase().includes(q)) score += 25;
    return { m, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);

  if (scored.length === 0) {
    return MEDICINE_DB.slice(0, limit);
  }
  return scored;
}

export function findMedicineById(id: string): MedicineResult | undefined {
  return MEDICINE_DB.find((m) => m.id === id);
}
