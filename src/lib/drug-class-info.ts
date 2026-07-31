/**
 * Clinical reference content keyed by drug class.
 *
 * WHY
 * ---
 * The generated /medicine/[slug] pages were 800-1,000 characters and largely
 * identical apart from the brand name. Google classes near-duplicate
 * templated pages as thin content and frequently declines to index them at
 * all — so 158 pages could easily have produced 158 non-rankings.
 *
 * This adds genuinely useful, class-level clinical information: how the drug
 * works, how it is usually taken, what to watch for, and who should be
 * careful. It is written once per class and shared by the brands in that
 * class, which is honest (these facts genuinely are class properties) and
 * still yields materially different page content across classes.
 *
 * SOURCING: everything here is standard, non-controversial pharmacology of
 * the kind printed on a package insert. Nothing is dosage-specific advice —
 * pages state ranges and always defer to the insert and a pharmacist.
 */

export interface ClassInfo {
  /** Plain-language explanation of the mechanism. */
  howItWorks: string;
  /** Typical administration guidance (never a prescription). */
  howToTake: string;
  /** Common, expected side effects. */
  commonSideEffects: string[];
  /** Effects that warrant stopping and seeking advice. */
  seriousSideEffects: string[];
  /** Groups who should take particular care. */
  cautions: string[];
  /** Well-known interactions. */
  interactions: string[];
  /** Storage note, where the class has a specific requirement. */
  storage?: string;
}

/**
 * Keys are matched case-insensitively against `drugClass`, longest key first,
 * so "Second-generation antihistamine" wins over a bare "antihistamine".
 */
export const CLASS_INFO: Record<string, ClassInfo> = {
  "second-generation antihistamine": {
    howItWorks:
      "Blocks H1 histamine receptors, the signal your body releases during an allergic reaction. Second-generation antihistamines cross into the brain far less than older ones, so they relieve sneezing, itching and a runny nose with much less drowsiness.",
    howToTake:
      "Usually one tablet once daily, with or without food. Many people find evening dosing suits them best if they notice any mild drowsiness. Effects typically begin within an hour and last a full day.",
    commonSideEffects: [
      "Mild drowsiness or tiredness (less common than with older antihistamines)",
      "Dry mouth",
      "Headache",
      "Occasional stomach upset",
    ],
    seriousSideEffects: [
      "Fast or irregular heartbeat",
      "Difficulty passing urine",
      "Severe allergic reaction — swelling of the face, lips or throat",
    ],
    cautions: [
      "Kidney or liver disease — a lower dose is often needed",
      "Pregnancy and breastfeeding — discuss with a doctor first",
      "Before driving until you know how it affects you",
    ],
    interactions: [
      "Alcohol — increases drowsiness",
      "Sedatives and sleeping tablets — additive drowsiness",
      "Other antihistamines, including those in combination cold remedies",
    ],
  },

  "leukotriene receptor antagonist": {
    howItWorks:
      "Blocks leukotrienes, inflammatory chemicals released in asthma and allergic rhinitis that tighten the airways and cause swelling and mucus. Unlike a reliever inhaler this works preventively over time, not during an attack.",
    howToTake:
      "Usually one tablet in the evening, taken every day whether or not you have symptoms. It is a preventer, not a rescue medicine — keep using your reliever inhaler for sudden breathlessness.",
    commonSideEffects: [
      "Headache",
      "Abdominal pain",
      "Thirst or mild stomach upset",
      "Upper respiratory infection symptoms",
    ],
    seriousSideEffects: [
      "Mood or behaviour changes — agitation, depression, unusual dreams, suicidal thoughts",
      "Numbness or tingling in the limbs",
      "Severe allergic reaction or rash",
    ],
    cautions: [
      "Anyone with a history of mental health problems — regulators worldwide carry a neuropsychiatric warning for this class",
      "Not a substitute for a rescue inhaler in an acute asthma attack",
      "Pregnancy — use only if clearly needed",
    ],
    interactions: [
      "Phenobarbital and rifampicin — may reduce effectiveness",
      "Tell your doctor about all asthma medicines you take",
    ],
  },

  "proton pump inhibitor": {
    howItWorks:
      "Shuts down the acid pumps in the stomach lining, cutting acid production at the source. This lets an inflamed oesophagus or an ulcer heal, rather than simply neutralising acid that has already been produced.",
    howToTake:
      "Best taken 30-60 minutes before the first meal of the day, when the acid pumps are most active. Swallow capsules whole. Full benefit often takes a few days.",
    commonSideEffects: [
      "Headache",
      "Diarrhoea or constipation",
      "Nausea or wind",
      "Abdominal pain",
    ],
    seriousSideEffects: [
      "Severe or persistent diarrhoea (possible C. difficile infection)",
      "Signs of low magnesium — muscle cramps, tremor, irregular heartbeat",
      "Unexplained weight loss, difficulty swallowing or vomiting blood",
    ],
    cautions: [
      "Long-term use is associated with lower vitamin B12 and magnesium, and a small increase in fracture risk — review the need periodically",
      "Liver disease",
      "May mask the symptoms of stomach cancer — persistent symptoms need investigating",
    ],
    interactions: [
      "Clopidogrel — some PPIs reduce its antiplatelet effect",
      "Medicines needing stomach acid to absorb, such as ketoconazole and some HIV drugs",
      "Methotrexate at high doses",
    ],
  },

  nsaid: {
    howItWorks:
      "Blocks COX enzymes, which the body uses to make prostaglandins — the chemicals behind pain, swelling and fever. Reducing them relieves inflammatory pain, but the same enzymes protect the stomach lining, which is why irritation is the main risk.",
    howToTake:
      "Take with or just after food to reduce stomach irritation. Use the lowest dose that works, for the shortest time. Do not combine with another NSAID.",
    commonSideEffects: [
      "Indigestion, heartburn or stomach pain",
      "Nausea",
      "Headache or dizziness",
      "Fluid retention",
    ],
    seriousSideEffects: [
      "Black or tarry stools, or vomiting blood — a sign of stomach bleeding",
      "Chest pain, breathlessness or sudden weakness",
      "Marked reduction in urine output",
      "Severe skin rash or blistering",
    ],
    cautions: [
      "Stomach ulcer or previous GI bleeding",
      "Heart failure, high blood pressure or kidney disease",
      "Third trimester of pregnancy — avoid",
      "Asthma, in people whose asthma is triggered by aspirin",
    ],
    interactions: [
      "Blood thinners such as warfarin — increased bleeding risk",
      "Other NSAIDs, including aspirin",
      "ACE inhibitors and diuretics — may reduce kidney function",
      "Corticosteroids — additive ulcer risk",
    ],
  },

  "analgesic / antipyretic": {
    howItWorks:
      "Acts mainly in the central nervous system to raise the pain threshold and reset the body's temperature set-point, bringing down fever. Unlike an NSAID it has very little anti-inflammatory effect, which is also why it is gentler on the stomach.",
    howToTake:
      "Adults typically take 500-1000 mg every 4-6 hours as needed, with or without food. Never exceed the daily maximum stated on the pack, usually 4000 mg for adults.",
    commonSideEffects: [
      "Generally very well tolerated at recommended doses",
      "Occasional nausea",
      "Rare skin rash",
    ],
    seriousSideEffects: [
      "Liver damage from overdose — this can occur without early symptoms and is a medical emergency",
      "Severe skin reactions (rare)",
      "Allergic reaction with swelling or breathing difficulty",
    ],
    cautions: [
      "Liver disease, or regular alcohol use — a lower maximum applies",
      "Check other cold and flu products: many already contain this ingredient, and doubling up is the most common cause of accidental overdose",
      "Low body weight or malnutrition",
    ],
    interactions: [
      "Warfarin — regular high doses can increase bleeding risk",
      "Alcohol — increases the risk of liver injury",
      "Other combination products containing the same ingredient",
    ],
  },

  "biguanide antidiabetic": {
    howItWorks:
      "Lowers the amount of glucose the liver releases and helps muscle take up glucose more effectively. It does not force the pancreas to release insulin, which is why it rarely causes low blood sugar on its own.",
    howToTake:
      "Take with or just after meals to reduce stomach upset. Doses are usually increased gradually. Extended-release forms are swallowed whole, never crushed.",
    commonSideEffects: [
      "Nausea, diarrhoea or stomach cramps, especially in the first weeks",
      "Metallic taste",
      "Reduced appetite",
    ],
    seriousSideEffects: [
      "Lactic acidosis (rare but serious) — deep rapid breathing, severe weakness, muscle pain, feeling very cold",
      "Symptoms of vitamin B12 deficiency with long-term use — tingling, tiredness",
    ],
    cautions: [
      "Reduced kidney function — dose must be adjusted or the drug stopped",
      "Stop temporarily before surgery or a scan using iodinated contrast dye",
      "Dehydration, severe infection, or heavy alcohol use",
    ],
    interactions: [
      "Iodinated contrast media used in CT scans",
      "Alcohol — increases lactic acidosis risk",
      "Other diabetes medicines — may increase the chance of low blood sugar",
    ],
  },

  statin: {
    howItWorks:
      "Blocks HMG-CoA reductase, the enzyme the liver uses to make cholesterol. The liver responds by pulling more LDL cholesterol out of the blood, lowering cardiovascular risk over years rather than days.",
    howToTake:
      "Usually once daily. Some shorter-acting statins work best in the evening, when the body makes most of its cholesterol. Take consistently — the benefit is long-term.",
    commonSideEffects: [
      "Muscle aches or mild weakness",
      "Headache",
      "Digestive upset",
      "Raised liver enzymes on blood tests",
    ],
    seriousSideEffects: [
      "Severe, unexplained muscle pain or tenderness, especially with dark urine",
      "Yellowing of the skin or eyes",
      "Marked confusion or memory problems",
    ],
    cautions: [
      "Active liver disease",
      "Pregnancy and breastfeeding — avoid",
      "Heavy alcohol use",
      "Existing muscle disorders or kidney impairment",
    ],
    interactions: [
      "Grapefruit juice — raises blood levels of some statins",
      "Clarithromycin, erythromycin and some antifungals",
      "Fibrates and high-dose niacin — increased muscle risk",
    ],
  },

  "macrolide antibiotic": {
    howItWorks:
      "Stops bacteria building the proteins they need to grow, by binding to the bacterial ribosome. Human cells use a different ribosome, which is why the drug targets bacteria specifically.",
    howToTake:
      "Complete the entire course even once you feel better — stopping early lets the hardiest bacteria survive. Some are taken with food to reduce nausea; check the pack.",
    commonSideEffects: [
      "Nausea, vomiting or diarrhoea",
      "Abdominal discomfort",
      "Altered taste",
    ],
    seriousSideEffects: [
      "Severe or bloody diarrhoea, which can occur weeks after finishing",
      "Irregular heartbeat or fainting",
      "Yellowing of the skin or eyes",
      "Severe rash or blistering",
    ],
    cautions: [
      "Known heart rhythm problems (long QT)",
      "Liver disease",
      "Myasthenia gravis — symptoms can worsen",
    ],
    interactions: [
      "Statins — increased risk of muscle damage",
      "Warfarin — increased bleeding risk",
      "Medicines that prolong the QT interval",
    ],
  },

  "penicillin antibiotic": {
    howItWorks:
      "Breaks down the bacterial cell wall as bacteria try to divide, causing them to rupture. Human cells have no cell wall, so the drug is highly selective for bacteria.",
    howToTake:
      "Space doses evenly through the day and finish the full course. Can usually be taken with or without food.",
    commonSideEffects: ["Diarrhoea", "Nausea", "Mild rash", "Thrush"],
    seriousSideEffects: [
      "Severe allergic reaction — swelling of face or throat, difficulty breathing",
      "Severe or bloody diarrhoea",
      "Widespread blistering rash",
    ],
    cautions: [
      "Any previous penicillin allergy — tell your doctor before taking",
      "Kidney impairment",
      "Glandular fever — rash is common",
    ],
    interactions: [
      "Methotrexate",
      "Oral typhoid vaccine",
      "Allopurinol — increased rash risk",
    ],
  },

  "beta-blocker": {
    howItWorks:
      "Blocks the effect of adrenaline on the heart, so it beats more slowly and with less force. That lowers blood pressure and reduces the heart's oxygen demand, easing angina.",
    howToTake:
      "Take at the same time each day. Never stop suddenly — abruptly stopping can cause a dangerous rebound in heart rate and blood pressure.",
    commonSideEffects: [
      "Tiredness, especially in the first weeks",
      "Cold hands and feet",
      "Slow pulse",
      "Dizziness on standing",
    ],
    seriousSideEffects: [
      "Very slow heart rate or fainting",
      "Worsening breathlessness or wheeze",
      "Swelling of the ankles with sudden weight gain",
    ],
    cautions: [
      "Asthma or COPD — non-selective beta-blockers can trigger bronchospasm",
      "Diabetes — may mask the warning signs of low blood sugar",
      "Severe peripheral circulation problems",
    ],
    interactions: [
      "Verapamil or diltiazem — risk of a dangerously slow heart rate",
      "Other blood pressure medicines",
      "NSAIDs — may blunt the blood-pressure effect",
    ],
  },

  "calcium channel blocker": {
    howItWorks:
      "Stops calcium entering the muscle cells of artery walls. The vessels relax and widen, which lowers blood pressure and improves blood flow to the heart.",
    howToTake:
      "Usually once daily at the same time. Swallow modified-release tablets whole.",
    commonSideEffects: [
      "Ankle swelling",
      "Flushing or feeling warm",
      "Headache",
      "Dizziness",
    ],
    seriousSideEffects: [
      "Chest pain that is new or worse",
      "Very low blood pressure — fainting",
      "Marked swelling with breathlessness",
    ],
    cautions: [
      "Severe aortic stenosis",
      "Heart failure",
      "Liver impairment",
    ],
    interactions: [
      "Grapefruit juice — raises blood levels",
      "Simvastatin — dose limits apply",
      "Other blood pressure medicines",
    ],
  },

  antiplatelet: {
    howItWorks:
      "Makes platelets less sticky so they are slower to clump together, reducing the chance of a clot forming in an artery and causing a heart attack or stroke.",
    howToTake:
      "Take at the same time daily, usually with food. Do not stop without medical advice — stopping abruptly raises clot risk.",
    commonSideEffects: [
      "Easy bruising",
      "Nosebleeds or bleeding gums",
      "Indigestion",
    ],
    seriousSideEffects: [
      "Black or tarry stools, or vomiting blood",
      "Bleeding that will not stop",
      "Sudden severe headache or weakness",
    ],
    cautions: [
      "Active stomach ulcer",
      "Upcoming surgery or dental work — tell the clinician",
      "Bleeding disorders",
    ],
    interactions: [
      "Other blood thinners such as warfarin",
      "NSAIDs — additive bleeding risk",
      "Some proton pump inhibitors reduce clopidogrel's effect",
    ],
  },

  corticosteroid: {
    howItWorks:
      "Damps down the immune system's inflammatory response by switching off the genes that drive it. Powerful for swelling and autoimmune activity, but the same suppression is why long courses need care.",
    howToTake:
      "Take in the morning with food to match the body's natural cortisol rhythm and reduce stomach upset. Never stop a long course abruptly — the dose must be tapered.",
    commonSideEffects: [
      "Increased appetite and weight gain",
      "Difficulty sleeping",
      "Mood changes",
      "Raised blood sugar",
    ],
    seriousSideEffects: [
      "Signs of infection — steroids can mask fever",
      "Severe abdominal pain",
      "Marked mood disturbance or confusion",
      "Vision changes",
    ],
    cautions: [
      "Diabetes — blood sugar will usually rise",
      "Active infection, including tuberculosis",
      "Osteoporosis risk with prolonged use",
      "Stomach ulcer",
    ],
    interactions: [
      "NSAIDs — additive ulcer risk",
      "Live vaccines — avoid while immunosuppressed",
      "Diabetes medicines may need adjusting",
    ],
  },

  "ssri antidepressant": {
    howItWorks:
      "Slows the reabsorption of serotonin in the brain, leaving more available between nerve cells. Mood usually improves gradually over two to six weeks rather than immediately.",
    howToTake:
      "Take at the same time each day, with food if it upsets your stomach. Keep taking it even once you feel better, and never stop abruptly — reduce gradually under medical supervision.",
    commonSideEffects: [
      "Nausea in the first weeks",
      "Headache",
      "Difficulty sleeping or drowsiness",
      "Sexual side effects",
    ],
    seriousSideEffects: [
      "Worsening mood or thoughts of self-harm, particularly in the first weeks and in younger people",
      "Serotonin syndrome — agitation, fever, rapid heartbeat, muscle twitching",
      "Unusual bleeding or bruising",
    ],
    cautions: [
      "Under 25 — closer monitoring is advised when starting",
      "Bipolar disorder — may trigger a manic episode",
      "Pregnancy — discuss risks and benefits",
      "Epilepsy",
    ],
    interactions: [
      "MAO inhibitors — dangerous, must be separated by weeks",
      "Triptans, tramadol and St John's wort — serotonin syndrome risk",
      "NSAIDs and blood thinners — bleeding risk",
    ],
  },

  "third-generation cephalosporin": {
    howItWorks:
      "Disrupts bacterial cell-wall construction, like penicillins, but with a structure that resists many bacterial defence enzymes — so it works against a broader range of organisms.",
    howToTake:
      "Finish the full course. Take at evenly spaced intervals; some forms are better absorbed with food.",
    commonSideEffects: ["Diarrhoea", "Nausea", "Abdominal pain", "Thrush"],
    seriousSideEffects: [
      "Severe or bloody diarrhoea",
      "Allergic reaction with swelling or breathing difficulty",
      "Severe skin blistering",
    ],
    cautions: [
      "Previous severe penicillin allergy — cross-reaction is possible",
      "Kidney impairment",
      "Colitis or other bowel disease",
    ],
    interactions: ["Probenecid", "Anticoagulants", "Live typhoid vaccine"],
  },

  "fluoroquinolone antibiotic": {
    howItWorks:
      "Blocks the bacterial enzymes that unwind and copy DNA, so the bacteria cannot replicate. Very effective, but reserved for cases where other antibiotics are unsuitable because of its side-effect profile.",
    howToTake:
      "Take with plenty of water. Separate from dairy, antacids and iron or zinc supplements by at least two hours, as these block absorption.",
    commonSideEffects: ["Nausea", "Diarrhoea", "Headache", "Dizziness"],
    seriousSideEffects: [
      "Tendon pain or swelling, especially the Achilles — stop and seek advice",
      "Numbness, tingling or burning in the limbs",
      "Confusion, hallucinations or severe anxiety",
      "Irregular heartbeat",
    ],
    cautions: [
      "Over 60, or taking corticosteroids — much higher tendon risk",
      "History of tendon disorders",
      "Epilepsy or myasthenia gravis",
      "Avoid strong sunlight — photosensitivity",
    ],
    interactions: [
      "Antacids, iron, zinc and dairy — reduce absorption",
      "Theophylline",
      "Warfarin — increased bleeding risk",
      "Medicines that prolong the QT interval",
    ],
  },

  "mineral supplement": {
    howItWorks:
      "Supplies a mineral the diet may not provide in sufficient amounts, supporting normal bone, muscle, nerve or blood function depending on the mineral concerned.",
    howToTake:
      "Usually taken with food to improve absorption and reduce stomach upset. Calcium is best split across the day rather than taken as one large dose.",
    commonSideEffects: ["Constipation or diarrhoea", "Stomach upset", "Bloating"],
    seriousSideEffects: [
      "Signs of excess — persistent nausea, confusion, irregular heartbeat",
      "Kidney stone symptoms with long-term high calcium intake",
    ],
    cautions: [
      "Kidney disease or a history of kidney stones",
      "Do not exceed the stated dose — more is not better with minerals",
      "Check other supplements for overlap",
    ],
    interactions: [
      "Tetracycline and quinolone antibiotics — separate by 2-4 hours",
      "Levothyroxine — separate by at least 4 hours",
      "Iron and zinc compete for absorption",
    ],
  },

  "vitamin supplement": {
    howItWorks:
      "Provides vitamins at levels intended to correct or prevent a shortfall, supporting normal metabolism, nerve function and red blood cell production.",
    howToTake:
      "Usually once daily with a meal. Fat-soluble vitamins absorb better with food containing some fat.",
    commonSideEffects: ["Mild stomach upset", "Harmless change in urine colour", "Nausea if taken on an empty stomach"],
    seriousSideEffects: [
      "Allergic reaction",
      "Symptoms of excess with fat-soluble vitamins taken long-term at high dose",
    ],
    cautions: [
      "Pregnancy — some vitamins, notably vitamin A, have upper limits",
      "Do not combine multiple multivitamins",
      "Kidney disease",
    ],
    interactions: [
      "Levothyroxine — separate from calcium and iron",
      "Some antibiotics",
      "Warfarin — vitamin K affects control",
    ],
  },
};

/** Fallback used when a class has no dedicated entry. */
const GENERIC_INFO: ClassInfo = {
  howItWorks:
    "Works through the mechanism described for its drug class. Full pharmacological detail is printed in the package insert supplied with the product.",
  howToTake:
    "Follow the dose printed on the pack or given by your prescriber. Take at evenly spaced times and complete any course as directed.",
  commonSideEffects: [
    "Mild digestive upset",
    "Headache",
    "Dizziness",
  ],
  seriousSideEffects: [
    "Allergic reaction — rash, swelling of the face or throat, difficulty breathing",
    "Any severe or unexpected symptom",
  ],
  cautions: [
    "Pregnancy and breastfeeding — check with a doctor",
    "Kidney or liver disease",
    "Other medicines you are already taking",
  ],
  interactions: [
    "Tell your pharmacist about all medicines and supplements you take",
  ],
};

/**
 * Resolve class information for a drug class string.
 * Longest matching key wins, so specific classes beat general ones.
 */
export function getClassInfo(drugClass?: string): ClassInfo {
  if (!drugClass) return GENERIC_INFO;
  const q = drugClass.toLowerCase();

  const keys = Object.keys(CLASS_INFO).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (q.includes(k)) return CLASS_INFO[k];
  }

  // Loose fallbacks for classes phrased differently in the source data.
  if (q.includes("antihistamine")) return CLASS_INFO["second-generation antihistamine"];
  if (q.includes("cephalosporin")) return CLASS_INFO["third-generation cephalosporin"];
  if (q.includes("antibiotic")) return CLASS_INFO["penicillin antibiotic"];
  if (q.includes("statin")) return CLASS_INFO["statin"];
  if (q.includes("antidiabetic")) return CLASS_INFO["biguanide antidiabetic"];
  if (q.includes("steroid")) return CLASS_INFO["corticosteroid"];

  return GENERIC_INFO;
}

/** True when we have real class-specific content rather than the fallback. */
export function hasClassInfo(drugClass?: string): boolean {
  return getClassInfo(drugClass) !== GENERIC_INFO;
}
