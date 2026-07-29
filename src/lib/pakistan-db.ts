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

  // ---- Diabetes ----
  { brand: "Glucophage XR", generic: "Metformin Hydrochloride", strength: "500 mg", form: "tablet",
    manufacturer: "Merck Pakistan", drugClass: "Biguanide antidiabetic (extended release)" },
  { brand: "Neodipar", generic: "Metformin Hydrochloride", strength: "500 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Biguanide antidiabetic" },
  { brand: "Diamicron", aliases: ["Diamicron MR"], generic: "Gliclazide", strength: "60 mg",
    form: "tablet", manufacturer: "Servier Pakistan", drugClass: "Sulfonylurea antidiabetic" },
  { brand: "Amaryl", generic: "Glimepiride", strength: "2 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Sulfonylurea antidiabetic" },
  { brand: "Januvia", generic: "Sitagliptin", strength: "100 mg", form: "tablet",
    manufacturer: "MSD Pakistan", drugClass: "DPP-4 inhibitor" },
  { brand: "Galvus", aliases: ["Galvus Met"], generic: "Vildagliptin", strength: "50 mg",
    form: "tablet", manufacturer: "Novartis Pakistan", drugClass: "DPP-4 inhibitor" },
  { brand: "Lantus", generic: "Insulin Glargine", strength: "100 IU/ml", form: "injection",
    manufacturer: "Sanofi Pakistan", drugClass: "Long-acting insulin" },
  { brand: "Novomix", aliases: ["NovoMix 30"], generic: "Insulin Aspart", strength: "100 IU/ml",
    form: "injection", manufacturer: "Novo Nordisk Pakistan", drugClass: "Biphasic insulin" },
  { brand: "Humulin", aliases: ["Humulin N", "Humulin R", "Humulin 70/30"], generic: "Human Insulin",
    strength: "100 IU/ml", form: "injection", manufacturer: "Eli Lilly Pakistan", drugClass: "Human insulin" },

  // ---- Cardiovascular (extended) ----
  { brand: "Angised", generic: "Glyceryl Trinitrate", strength: "0.5 mg", form: "tablet",
    manufacturer: "GSK Pakistan", drugClass: "Nitrate vasodilator" },
  { brand: "Isordil", generic: "Isosorbide Dinitrate", strength: "5 mg", form: "tablet",
    manufacturer: "Wyeth Pakistan", drugClass: "Nitrate vasodilator" },
  { brand: "Loprin", generic: "Aspirin (Acetylsalicylic Acid)", strength: "75 mg", form: "tablet",
    manufacturer: "Highnoon Laboratories", drugClass: "Antiplatelet" },
  { brand: "Ascard", generic: "Aspirin (Acetylsalicylic Acid)", strength: "75 mg", form: "tablet",
    manufacturer: "Atco Laboratories", drugClass: "Antiplatelet" },
  { brand: "Plavix", generic: "Clopidogrel", strength: "75 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Antiplatelet" },
  { brand: "Osclot", generic: "Clopidogrel", strength: "75 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Antiplatelet" },
  { brand: "Coversyl", generic: "Perindopril", strength: "5 mg", form: "tablet",
    manufacturer: "Servier Pakistan", drugClass: "ACE inhibitor" },
  { brand: "Zestril", generic: "Lisinopril", strength: "10 mg", form: "tablet",
    manufacturer: "AstraZeneca Pakistan", drugClass: "ACE inhibitor" },
  { brand: "Exforge", generic: "Amlodipine + Valsartan", strength: "5 mg / 80 mg", form: "tablet",
    manufacturer: "Novartis Pakistan", drugClass: "CCB + ARB combination" },
  { brand: "Diovan", generic: "Valsartan", strength: "80 mg", form: "tablet",
    manufacturer: "Novartis Pakistan", drugClass: "Angiotensin receptor blocker" },
  { brand: "Lasix", generic: "Furosemide", strength: "40 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Loop diuretic" },
  { brand: "Inderal", generic: "Propranolol", strength: "10 mg", form: "tablet",
    manufacturer: "Wyeth Pakistan", drugClass: "Non-selective beta-blocker" },
  { brand: "Rosuvas", generic: "Rosuvastatin", strength: "10 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Statin" },

  // ---- Antibiotics (extended) ----
  { brand: "Calamox", generic: "Amoxicillin + Clavulanic Acid", strength: "625 mg", form: "tablet",
    manufacturer: "Bosch Pharmaceuticals", drugClass: "Beta-lactam antibiotic" },
  { brand: "Zithromax", generic: "Azithromycin", strength: "500 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Macrolide antibiotic" },
  { brand: "Rocephin", generic: "Ceftriaxone", strength: "1 g", form: "injection",
    manufacturer: "Roche Pakistan", drugClass: "Third-generation cephalosporin" },
  { brand: "Oxidil", generic: "Ceftriaxone", strength: "1 g", form: "injection",
    manufacturer: "Hilton Pharma", drugClass: "Third-generation cephalosporin" },
  { brand: "Septran", generic: "Sulfamethoxazole + Trimethoprim", strength: "800 mg / 160 mg",
    form: "tablet", manufacturer: "GSK Pakistan", drugClass: "Sulfonamide antibiotic" },
  { brand: "Doxycap", generic: "Doxycycline", strength: "100 mg", form: "capsule",
    manufacturer: "Pharmedic Pakistan", drugClass: "Tetracycline antibiotic" },
  { brand: "Levoflox", aliases: ["Leflox"], generic: "Levofloxacin", strength: "500 mg", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Fluoroquinolone antibiotic" },
  { brand: "Fungone", generic: "Fluconazole", strength: "150 mg", form: "capsule",
    manufacturer: "Genix Pharma", drugClass: "Antifungal" },
  { brand: "Diflucan", generic: "Fluconazole", strength: "150 mg", form: "capsule",
    manufacturer: "Pfizer Pakistan", drugClass: "Antifungal" },

  // ---- Gastro (extended) ----
  { brand: "Omepral", generic: "Omeprazole", strength: "20 mg", form: "capsule",
    manufacturer: "Highnoon Laboratories", drugClass: "Proton pump inhibitor" },
  { brand: "Zoltar", generic: "Esomeprazole", strength: "40 mg", form: "tablet",
    manufacturer: "Hilton Pharma", drugClass: "Proton pump inhibitor" },
  { brand: "Gaviscon", generic: "Sodium Alginate + Sodium Bicarbonate", form: "syrup",
    manufacturer: "Reckitt Benckiser Pakistan", drugClass: "Antacid / reflux suppressant", otc: true },
  { brand: "Mucaine", generic: "Aluminium Hydroxide + Magnesium Hydroxide + Oxethazaine",
    form: "syrup", manufacturer: "Pfizer Pakistan", drugClass: "Antacid", otc: true },
  { brand: "Buscopan", generic: "Hyoscine Butylbromide", strength: "10 mg", form: "tablet",
    manufacturer: "Boehringer Ingelheim Pakistan", drugClass: "Antispasmodic" },
  { brand: "Imodium", generic: "Loperamide", strength: "2 mg", form: "capsule",
    manufacturer: "Johnson & Johnson Pakistan", drugClass: "Antidiarrhoeal", otc: true },
  { brand: "ORS", aliases: ["Peditral", "Oral Rehydration Salts"], generic: "Oral Rehydration Salts",
    form: "powder", drugClass: "Rehydration therapy", otc: true },
  { brand: "Duphalac", generic: "Lactulose", form: "syrup",
    manufacturer: "Abbott Pakistan", drugClass: "Osmotic laxative", otc: true },
  { brand: "Vomilast", generic: "Ondansetron", strength: "4 mg", form: "tablet",
    manufacturer: "Genix Pharma", drugClass: "5-HT3 antagonist antiemetic" },
  { brand: "Gravinate", generic: "Dimenhydrinate", strength: "50 mg", form: "tablet",
    manufacturer: "Searle Pakistan", drugClass: "Antiemetic / antivertigo", otc: true },

  // ---- Respiratory (extended) ----
  { brand: "Seretide", generic: "Salmeterol + Fluticasone", strength: "25/125 mcg", form: "inhaler",
    manufacturer: "GSK Pakistan", drugClass: "LABA + inhaled corticosteroid" },
  { brand: "Flixotide", generic: "Fluticasone Propionate", strength: "125 mcg", form: "inhaler",
    manufacturer: "GSK Pakistan", drugClass: "Inhaled corticosteroid" },
  { brand: "Theophylline", aliases: ["Neophylline"], generic: "Theophylline", strength: "200 mg",
    form: "tablet", drugClass: "Bronchodilator (xanthine)" },
  { brand: "Mucolator", generic: "Acetylcysteine", form: "syrup",
    manufacturer: "Bosch Pharmaceuticals", drugClass: "Mucolytic" },
  { brand: "Ambrolytic", generic: "Ambroxol Hydrochloride", form: "syrup",
    manufacturer: "Pharmatec Pakistan", drugClass: "Mucolytic / expectorant", otc: true },

  // ---- Pain / neuro / psych ----
  { brand: "Tramal", generic: "Tramadol Hydrochloride", strength: "50 mg", form: "capsule",
    manufacturer: "Searle Pakistan", drugClass: "Opioid analgesic" },
  { brand: "Lyrica", generic: "Pregabalin", strength: "75 mg", form: "capsule",
    manufacturer: "Pfizer Pakistan", drugClass: "Anticonvulsant / neuropathic pain" },
  { brand: "Gabapin", generic: "Gabapentin", strength: "300 mg", form: "capsule",
    manufacturer: "Sami Pharmaceuticals", drugClass: "Anticonvulsant / neuropathic pain" },
  { brand: "Tegral", generic: "Carbamazepine", strength: "200 mg", form: "tablet",
    manufacturer: "Novartis Pakistan", drugClass: "Anticonvulsant" },
  { brand: "Epival", generic: "Sodium Valproate", strength: "500 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Anticonvulsant" },
  { brand: "Lexotanil", generic: "Bromazepam", strength: "3 mg", form: "tablet",
    manufacturer: "Roche Pakistan", drugClass: "Benzodiazepine anxiolytic" },
  { brand: "Xanax", generic: "Alprazolam", strength: "0.25 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Benzodiazepine anxiolytic" },
  { brand: "Nexito", generic: "Escitalopram", strength: "10 mg", form: "tablet",
    manufacturer: "Sami Pharmaceuticals", drugClass: "SSRI antidepressant" },
  { brand: "Prozac", generic: "Fluoxetine", strength: "20 mg", form: "capsule",
    manufacturer: "Eli Lilly Pakistan", drugClass: "SSRI antidepressant" },
  { brand: "Risperdal", generic: "Risperidone", strength: "2 mg", form: "tablet",
    manufacturer: "Johnson & Johnson Pakistan", drugClass: "Atypical antipsychotic" },
  { brand: "Stemetil", generic: "Prochlorperazine", strength: "5 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Antiemetic / antipsychotic" },

  // ---- Steroids / anti-inflammatory ----
  { brand: "Deltacortril", generic: "Prednisolone", strength: "5 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Corticosteroid" },
  { brand: "Solu-Medrol", generic: "Methylprednisolone", strength: "40 mg", form: "injection",
    manufacturer: "Pfizer Pakistan", drugClass: "Corticosteroid" },
  { brand: "Decadron", generic: "Dexamethasone", strength: "0.5 mg", form: "tablet",
    manufacturer: "Merck Pakistan", drugClass: "Corticosteroid" },
  { brand: "Voltral", aliases: ["Voltaren"], generic: "Diclofenac Sodium", strength: "50 mg",
    form: "tablet", manufacturer: "Novartis Pakistan", drugClass: "NSAID" },
  { brand: "Caflam", generic: "Diclofenac Potassium", strength: "50 mg", form: "tablet",
    manufacturer: "Novartis Pakistan", drugClass: "NSAID" },
  { brand: "Celebrex", generic: "Celecoxib", strength: "200 mg", form: "capsule",
    manufacturer: "Pfizer Pakistan", drugClass: "COX-2 selective NSAID" },

  // ---- Thyroid / hormones / urology ----
  { brand: "Thyroxine", aliases: ["Thyrox", "Eltroxin"], generic: "Levothyroxine Sodium",
    strength: "50 mcg", form: "tablet", manufacturer: "GSK Pakistan", drugClass: "Thyroid hormone" },
  { brand: "Neo-Mercazole", generic: "Carbimazole", strength: "5 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Antithyroid" },
  { brand: "Duphaston", generic: "Dydrogesterone", strength: "10 mg", form: "tablet",
    manufacturer: "Abbott Pakistan", drugClass: "Progestogen" },
  { brand: "Provera", generic: "Medroxyprogesterone Acetate", strength: "10 mg", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Progestogen" },
  { brand: "Xatral", generic: "Alfuzosin", strength: "10 mg", form: "tablet",
    manufacturer: "Sanofi Pakistan", drugClass: "Alpha-blocker (BPH)" },
  { brand: "Uromax", generic: "Tamsulosin", strength: "0.4 mg", form: "capsule",
    manufacturer: "Genix Pharma", drugClass: "Alpha-blocker (BPH)" },

  // ---- Topical / dermatology / eye ----
  { brand: "Betnovate", aliases: ["Betnovate-N", "Betnovate-C"], generic: "Betamethasone Valerate",
    form: "cream", manufacturer: "GSK Pakistan", drugClass: "Topical corticosteroid" },
  { brand: "Dermovate", generic: "Clobetasol Propionate", form: "cream",
    manufacturer: "GSK Pakistan", drugClass: "Potent topical corticosteroid" },
  { brand: "Polyfax", generic: "Polymyxin B + Bacitracin", form: "ointment",
    manufacturer: "GSK Pakistan", drugClass: "Topical antibiotic", otc: true },
  { brand: "Fucidin", generic: "Fusidic Acid", form: "cream",
    manufacturer: "Leo Pharma / Highnoon", drugClass: "Topical antibiotic" },
  { brand: "Canesten", generic: "Clotrimazole", form: "cream",
    manufacturer: "Bayer Pakistan", drugClass: "Topical antifungal", otc: true },
  { brand: "Tobrex", generic: "Tobramycin", form: "drops",
    manufacturer: "Novartis / Alcon Pakistan", drugClass: "Ophthalmic antibiotic" },
  { brand: "Optive", generic: "Carboxymethylcellulose Sodium", form: "drops",
    manufacturer: "Allergan Pakistan", drugClass: "Ocular lubricant", otc: true },

  // ---- Vitamins / supplements (extended) ----
  { brand: "Qalsan D", generic: "Calcium Carbonate + Vitamin D3", form: "tablet",
    manufacturer: "Getz Pharma", drugClass: "Mineral supplement", otc: true },
  { brand: "Osnate D", generic: "Calcium Citrate + Vitamin D3", form: "tablet",
    manufacturer: "Hilton Pharma", drugClass: "Mineral supplement", otc: true },
  { brand: "Indever", generic: "Vitamin D3 (Cholecalciferol)", strength: "200,000 IU",
    form: "injection", drugClass: "Vitamin D supplement" },
  { brand: "Folic Acid", aliases: ["Folicap"], generic: "Folic Acid", strength: "5 mg",
    form: "tablet", drugClass: "Vitamin supplement", otc: true },
  { brand: "Zincat", generic: "Zinc Sulphate", form: "syrup",
    manufacturer: "Hilton Pharma", drugClass: "Mineral supplement", otc: true },
  { brand: "Centrum", generic: "Multivitamin + Multimineral", form: "tablet",
    manufacturer: "Pfizer Pakistan", drugClass: "Multivitamin", otc: true },
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
