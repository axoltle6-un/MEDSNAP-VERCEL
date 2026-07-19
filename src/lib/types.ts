// MedSnap — shared type definitions

export type Confidence = "high" | "medium" | "low";

export type MedicineForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "injection"
  | "cream"
  | "drops"
  | "inhaler"
  | "patch"
  | "suppository"
  | "powder"
  | "unknown";

/** Visual appearance — used by the SVG illustration component */
export interface PillAppearance {
  shape: "round" | "oval" | "capsule" | "caplet" | "irregular" | "bottle" | "inhaler" | "tube";
  color: string;          // primary color, hex
  colorSecondary?: string; // for two-tone capsules
  hasScore?: boolean;      // line down the middle
  coating?: "film" | "sugar" | "none";
}

export interface SideEffect {
  name: string;
  severity: "common" | "serious";
  notes?: string;
}

export interface Interaction {
  with: string;
  severity: "caution" | "avoid";
  note: string;
}

export interface AvoidFor {
  group: string;
  reason: string;
}

export interface MedicineResult {
  id: string;
  brandName: string;
  genericName: string;
  manufacturer?: string;
  // Strength (the "calorie count" moment)
  strengthValue: string;       // e.g. "500"
  strengthUnit: string;        // e.g. "mg", "mcg", "ml", "%"
  strengthDisplay: string;     // pre-rendered big-number string e.g. "500 mg"
  form: MedicineForm;
  packageSize?: string;        // e.g. "20 tablets", "100 ml bottle"
  usedFor: string[];
  activeIngredients: string[];
  commonSideEffects: string[];
  seriousSideEffects: string[];
  interactions: Interaction[];
  whoShouldAvoid: AvoidFor[];
  storageInstructions: string;

  // --- NEW: richer pharmacology fields ---
  drugClass?: string;                    // e.g. "NSAID", "Beta-lactam antibiotic"
  mechanismOfAction?: string;            // plain-language "how it works"
  composition?: string;                  // what it's made of (chemical composition)
  halfLife?: string;                     // e.g. "2-3 hours"
  onsetOfAction?: string;                // e.g. "30-60 minutes"
  durationOfAction?: string;             // e.g. "4-6 hours"
  metabolism?: string;                   // e.g. "Liver (CYP3A4)"
  excretion?: string;                    // e.g. "Kidney"
  pregnancyCategory?: string;            // e.g. "Category B (US FDA)"
  breastfeedingSafe?: boolean | "unknown";
  ageWarnings?: string[];                // e.g. ["Not for children under 12"]
  overdoseSymptoms?: string[];
  whatToDoIfMissed?: string;
  dietaryAdvice?: string[];              // e.g. ["Take with food", "Avoid grapefruit"]
  relatedMedicines?: string[];           // alternative brands / same-class drugs

  // Visual / extras
  appearance?: PillAppearance;           // for SVG illustration
  confidence: Confidence;
  matchNote?: string;
  sources: { label: string; url?: string }[];
  imprint?: string;
  imageUrl?: string; // Real pill image from NIH/Wikipedia/PubChem
  images?: { url: string; label: string; source: string }[]; // Multi-photo gallery (Package, Imprint, Molecular 2D)
  controlledSubstance?: boolean;
  highRisk?: boolean;
  howItWorks?: string;                   // alias kept for backwards compat
  warningsRaw?: string;
}

export interface ScanRecord {
  id: string;
  createdAt: number;
  medicine: MedicineResult;
  photos: string[];
  query?: string;
  source: "camera" | "gallery" | "search";
  notes?: string;
  isFavorite?: boolean;
  tags?: string[];
  docType?: "lab-report" | "prescription" | "vaccine" | "emergency";
}

export type Screen =
  | "auth"
  | "reset-password"
  | "email-verification-gate"
  | "onboarding"
  | "landing"
  | "paywall"
  | "checkout"
  | "home"
  | "capture"
  | "analyzing"
  | "results"
  | "result-detail"
  | "history"
  | "search"
  | "browse"
  | "settings"
  | "legal-disclaimer"
  | "legal-terms"
  | "legal-privacy";

export type OnboardingRole =
  | "personal"
  | "caregiver"
  | "elderly-parent"
  | "curiosity";

export interface UserProfile {
  role: OnboardingRole | null;
  takesMedicationRegularly: boolean | null;
  allergies: string[];
  conditions: string[];
}

export interface AppSettings {
  units: "metric" | "imperial";
  showDisclaimerOnScan: boolean;
  highContrastWarnings: boolean;
  language?: "en" | "es" | "fr" | "de" | "ar";
}

export interface ReportFeedback {
  scanId: string;
  field: string;
  issue: string;
  createdAt: number;
}
