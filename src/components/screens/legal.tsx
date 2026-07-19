"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  ShieldAlert,
  FileText,
  Lock,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

type LegalKind = "disclaimer" | "terms" | "privacy";

const CONTENT: Record<
  LegalKind,
  {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    updated: string;
    intro: string;
    sections: { heading: string; body: string[] }[];
  }
> = {
  disclaimer: {
    title: "Medical Disclaimer",
    icon: ShieldAlert,
    accent: "bg-warn-soft text-warn-foreground",
    updated: "Last updated: July 2026",
    intro:
      "MedSnap provides general information about medicines based on photo identification and public drug databases. It is not a medical device, and the information it provides is not a substitute for professional medical advice, diagnosis, or treatment.",
    sections: [
      {
        heading: "Not a substitute for professional advice",
        body: [
          "Always seek the advice of a qualified physician, pharmacist, or other licensed medical professional with any questions you may have about a medication or medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or identified using MedSnap.",
          "If you think you may have a medical emergency, call your local emergency number (e.g. 911 in the US, 999 in the UK, 112 in the EU) immediately. Do not rely on MedSnap in an emergency.",
        ],
      },
      {
        heading: "Accuracy is not guaranteed",
        body: [
          "MedSnap uses AI vision and public drug databases to identify medicines. Identification may be incorrect, incomplete, or fail entirely — especially when photos are unclear, when the medicine is not in our reference databases, or when the imprint is partially obscured.",
          "Always confirm any identification with the original packaging, the patient information leaflet, or a pharmacist before taking or making decisions about a medicine.",
          "MedSnap explicitly does not recommend doses. It only reports what is printed on the medicine or its packaging. Dosing decisions must be made by a qualified healthcare professional.",
        ],
      },
      {
        heading: "No doctor-patient relationship",
        body: [
          "Using MedSnap does not create a doctor-patient, pharmacist-patient, or any other clinical relationship between you and MedSnap or its operators. No content in this app should be interpreted as personal medical advice.",
        ],
      },
      {
        heading: "Allergies and interactions",
        body: [
          "MedSnap makes a best-effort attempt to flag potential allergies and interactions based on the information you provide and the medicine identified. This feature is informational only and may not detect every relevant interaction. Always consult a pharmacist or doctor about interactions, especially when starting a new medicine.",
        ],
      },
      {
        heading: "Use at your own risk",
        body: [
          "By using MedSnap, you accept full responsibility for any decisions you make based on the information it provides. MedSnap and its operators are not liable for any harm, loss, or damage arising from use of or reliance on this app.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    icon: FileText,
    accent: "bg-trust-soft text-trust",
    updated: "Last updated: July 2026",
    intro:
      "These Terms of Service govern your use of the MedSnap web application. By using MedSnap, you agree to these terms. If you do not agree, please do not use the app.",
    sections: [
      {
        heading: "Eligibility",
        body: [
          "You must be at least 13 years old to use MedSnap. If you are under 18, you confirm that a parent or legal guardian has reviewed and agreed to these terms on your behalf.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "You agree to use MedSnap only for lawful purposes. You will not use the app to identify medicines for the purpose of obtaining or distributing controlled substances illegally, nor to harm, harass, or deceive others.",
          "You will not attempt to reverse-engineer, scrape, or overload the service, or use automated tools to access it without our permission.",
        ],
      },
      {
        heading: "Accounts",
        body: [
          "Some features (such as syncing scan history across devices) may require an account. You are responsible for keeping your account credentials secure and for all activity that occurs under your account.",
        ],
      },
      {
        heading: "Subscriptions and billing",
        body: [
          "MedSnap offers a free tier and an optional paid subscription ('MedSnap Pro'). Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current billing period.",
          "Refunds are handled according to the platform through which you purchased the subscription. We reserve the right to change pricing with reasonable advance notice.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "MedSnap, its design, source code, and branding are owned by MedSnap and protected by applicable intellectual property laws. Drug information sourced from openFDA, RxNorm, DailyMed, and other public databases remains the property of those sources.",
        ],
      },
      {
        heading: "Termination",
        body: [
          "We may suspend or terminate your access to MedSnap if you violate these terms. You may stop using the app and delete your data at any time from Settings.",
        ],
      },
      {
        heading: "Changes to these terms",
        body: [
          "We may update these terms from time to time. Material changes will be communicated through the app or by email. Continued use after changes take effect constitutes acceptance of the updated terms.",
        ],
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    icon: Lock,
    accent: "bg-safe-soft text-safe",
    updated: "Last updated: July 2026",
    intro:
      "MedSnap is designed with privacy in mind. Because scan history can be health-adjacent information, we treat it with the same care as personal health records. This policy explains what we collect, how we use it, and the choices you have.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Photos you take or upload for identification are sent securely to our AI identification service to be analyzed. They are not stored on our servers after identification completes.",
          "Your scan history (the identification result, the date, and any notes you add) is stored locally on your device by default. If you sign in to your account, scan history may be synced to your account and stored encrypted at rest.",
          "Your onboarding answers (role, medication regularity, allergies, conditions) are stored on your device and used only to personalize warnings within the app.",
        ],
      },
      {
        heading: "How we use your information",
        body: [
          "To identify medicines from your photos and display structured information.",
          "To flag potential allergy conflicts and interactions on your scans.",
          "To improve the accuracy of our identification model in aggregate. We do not use the contents of individual photos to train models without explicit opt-in.",
          "To provide customer support and respond to reports of incorrect information.",
        ],
      },
      {
        heading: "What we do not do",
        body: [
          "We do not sell your personal or health-adjacent information to third parties.",
          "We do not share your scan history with advertisers.",
          "We do not use your data to make automated decisions about your eligibility for insurance, employment, or credit.",
        ],
      },
      {
        heading: "Data retention and deletion",
        body: [
          "Local scan history persists on your device until you delete it. You can clear all history from Settings → Data & privacy, or delete individual scans from the History screen.",
          "If you have an account, deleting your account also deletes all synced scan history and profile data within 30 days.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "MedSnap uses cookies and browser local storage to keep you signed in, remember your preferences (theme, units, allergy list), and provide core app functionality. These are strictly necessary for the app to work — the app cannot function without them.",
          "We do not use advertising cookies, tracking pixels, or third-party analytics cookies. We do not sell data derived from cookies.",
          "When you first visit MedSnap, you'll see a cookie consent banner where you can accept or reject non-essential storage. Essential storage (needed for sign-in and core features) is always enabled.",
          "You can change your cookie preference at any time by clearing your browser data for this site.",
        ],
      },
      {
        heading: "Security",
        body: [
          "Photos in transit are sent over HTTPS. Synced scan history is encrypted at rest. Access to production systems is restricted and audited.",
          "No method of transmission or storage is 100% secure. We cannot guarantee absolute security, but we work to protect your information using industry-standard practices.",
        ],
      },
      {
        heading: "Children's privacy",
        body: [
          "MedSnap is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "Depending on your location, you may have rights to access, correct, export, or delete your personal information. You can exercise most of these rights directly from Settings. For account-level requests, contact us through the support email.",
        ],
      },
      {
        heading: "Contact",
        body: [
          "If you have questions about this Privacy Policy, please contact us at privacy@medsnap.app (placeholder — replace with your actual contact address before launch).",
        ],
      },
    ],
  },
};

export function LegalScreen({ kind }: { kind: LegalKind }) {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const data = CONTENT[kind];
  const Icon = data.icon;

  return (
    <div className="flex flex-col gap-4 py-3">
      <div className="flex items-center gap-2">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold leading-tight">{data.title}</h1>
          <p className="text-xs text-muted-foreground">{data.updated}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="overflow-hidden border-border/60 shadow-soft">
          <div className={`flex items-center gap-3 p-5 ${data.accent}`}>
            <Icon className="h-6 w-6" />
            <p className="text-sm font-semibold">{data.title}</p>
          </div>
          <div className="space-y-5 p-5">
            <p className="text-sm text-muted-foreground">{data.intro}</p>

            {data.sections.map((s, i) => (
              <div key={i} className="space-y-2">
                <h2 className="text-base font-semibold">{s.heading}</h2>
                {s.body.map((p, j) => (
                  <p key={j} className="text-sm leading-relaxed text-foreground/90">
                    {p}
                  </p>
                ))}
              </div>
            ))}

            {kind === "disclaimer" && (
              <div className="rounded-2xl bg-danger-soft/60 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div>
                    <p className="text-sm font-bold text-danger">In an emergency</p>
                    <p className="mt-1 text-sm text-foreground/90">
                      If you or someone else has taken the wrong medicine, taken too
                      much, or is having a serious reaction, contact your local emergency
                      services immediately (911 in the US, 999 in the UK, 112 in the EU)
                      or call your local poison control center.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Cross-links */}
      <div className="space-y-2">
        {kind !== "disclaimer" && (
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl"
            onClick={() => navigate("legal-disclaimer")}
          >
            <ShieldAlert className="mr-2 h-4 w-4" /> Read medical disclaimer
          </Button>
        )}
        {kind !== "terms" && (
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl"
            onClick={() => navigate("legal-terms")}
          >
            <FileText className="mr-2 h-4 w-4" /> Read Terms of Service
          </Button>
        )}
        {kind !== "privacy" && (
          <Button
            variant="outline"
            className="w-full justify-start rounded-xl"
            onClick={() => navigate("legal-privacy")}
          >
            <Lock className="mr-2 h-4 w-4" /> Read Privacy Policy
          </Button>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground">
        <HeartPulse className="h-3.5 w-3.5" />
        Made with care for safer medicine use.
      </div>
    </div>
  );
}

// Convenience wrappers for each screen type
export function DisclaimerLegal() {
  return <LegalScreen kind="disclaimer" />;
}
export function TermsLegal() {
  return <LegalScreen kind="terms" />;
}
export function PrivacyLegal() {
  return <LegalScreen kind="privacy" />;
}

// Type guard so the orchestrator can map screen → kind
export function legalKindFor(screen: Screen): LegalKind | null {
  if (screen === "legal-disclaimer") return "disclaimer";
  if (screen === "legal-terms") return "terms";
  if (screen === "legal-privacy") return "privacy";
  return null;
}
