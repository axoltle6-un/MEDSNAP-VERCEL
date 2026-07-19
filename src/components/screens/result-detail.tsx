"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  AlertTriangle,
  Pill,
  Beaker,
  Activity,
  HeartPulse,
  Ban,
  Thermometer,
  ExternalLink,
  Info,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getTranslation, translateMedicalText } from "@/lib/translations";
import { FormIcon, formLabel, ConfidenceBadge } from "@/components/medicine/primitives";

export function ResultDetailScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const result = useAppStore((s) => s.currentResult);
  const section = useAppStore((s) => s.activeDetailSection);
  const lang = useAppStore((s) => s.settings.language);

  if (!result) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">No result to show.</p>
        <Button onClick={goBack} className="mt-4">Back</Button>
      </div>
    );
  }

  const meta = SECTION_META[section ?? "uses"];
  if (!meta) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">Section not found.</p>
        <Button onClick={goBack} className="mt-4">Back</Button>
      </div>
    );
  }

  const Icon = meta.icon;
  const titleText = getTranslation(lang, meta.titleKey);

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
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {result.brandName}
          </p>
          <h1 className="text-xl font-bold leading-tight">{titleText}</h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="border-border/60 p-5 shadow-soft">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                meta.accentClasses
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{translateMedicalText(formLabel(result.form), lang)} · {result.strengthDisplay}</p>
              <ConfidenceBadge confidence={result.confidence} />
            </div>
          </div>

          {meta.subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">{translateMedicalText(meta.subtitle, lang)}</p>
          )}

          <div className="mt-4">{renderSection(section ?? "uses", result, lang)}</div>
        </Card>
      </motion.div>

      {/* Disclaimer footer */}
      <div className="rounded-2xl bg-muted/60 p-4 text-xs text-muted-foreground">
        <div className="mb-1 flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="h-3.5 w-3.5" />
          Reminder
        </div>
        This information is for general education only. Always consult a doctor or
        pharmacist before starting, stopping, or changing any medication.
      </div>
    </div>
  );
}

const SECTION_META: Record<
  string,
  {
    titleKey: string;
    icon: React.ComponentType<{ className?: string }>;
    accentClasses: string;
    subtitle?: string;
  }
> = {
  uses: {
    titleKey: "whatItsUsedFor",
    icon: Activity,
    accentClasses: "bg-trust-soft text-trust",
    subtitle: "Conditions this medicine is commonly prescribed or recommended for.",
  },
  "common-side-effects": {
    titleKey: "commonSideEffects",
    icon: Pill,
    accentClasses: "bg-safe-soft text-safe",
    subtitle:
      "Effects that are typically mild and don't require medical attention. Contact a pharmacist if they persist or become bothersome.",
  },
  "serious-side-effects": {
    titleKey: "seriousSideEffects",
    icon: AlertTriangle,
    accentClasses: "bg-danger-soft text-danger",
    subtitle:
      "Stop taking the medicine and contact a doctor immediately if you experience any of these.",
  },
  interactions: {
    titleKey: "interactions",
    icon: HeartPulse,
    accentClasses: "bg-warn-soft text-warn-foreground",
    subtitle: "Other drugs, foods, or substances that may affect how this medicine works.",
  },
  "who-should-avoid": {
    titleKey: "whoShouldAvoid",
    icon: Ban,
    accentClasses: "bg-warn-soft text-warn-foreground",
    subtitle: "Groups for whom this medicine may be unsafe or require special caution.",
  },
  storage: {
    titleKey: "storageInstructions",
    icon: Thermometer,
    accentClasses: "bg-trust-soft text-trust",
    subtitle: "How to store this medicine to keep it effective and safe.",
  },
  sources: {
    titleKey: "sources",
    icon: ExternalLink,
    accentClasses: "bg-trust-soft text-trust",
    subtitle: "Where this information was sourced from.",
  },
};

function renderSection(section: string, result: import("@/lib/types").MedicineResult, lang?: any) {
  switch (section) {
    case "uses":
      return (
        <ul className="space-y-3">
          {result.usedFor.map((u, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-trust" />
              <span>{translateMedicalText(u, lang)}</span>
            </li>
          ))}
        </ul>
      );

    case "common-side-effects":
      return (
        <ul className="space-y-3">
          {result.commonSideEffects.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-safe" />
              <span>{translateMedicalText(s, lang)}</span>
            </li>
          ))}
        </ul>
      );

    case "serious-side-effects":
      return (
        <ul className="space-y-3">
          {result.seriousSideEffects.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded-xl bg-danger-soft/40 p-3 text-sm"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
              <span>{translateMedicalText(s, lang)}</span>
            </li>
          ))}
        </ul>
      );

    case "interactions":
      return (
        <div className="space-y-2.5">
          {result.interactions.map((ix, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border p-3",
                ix.severity === "avoid"
                  ? "border-danger/30 bg-danger-soft/40"
                  : "border-warn/30 bg-warn-soft/40"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{ix.with}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    ix.severity === "avoid"
                      ? "bg-danger text-danger-foreground"
                      : "bg-warn text-warn-foreground"
                  )}
                >
                  {ix.severity === "avoid" ? "Avoid" : "Caution"}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{translateMedicalText(ix.note, lang)}</p>
            </div>
          ))}
        </div>
      );

    case "who-should-avoid":
      return (
        <div className="space-y-2.5">
          {result.whoShouldAvoid.map((w, i) => (
            <div key={i} className="rounded-xl bg-warn-soft/40 p-3">
              <p className="text-sm font-semibold">{w.group}</p>
              <p className="mt-1 text-xs text-muted-foreground">{translateMedicalText(w.reason, lang)}</p>
            </div>
          ))}
        </div>
      );

    case "storage":
      return (
        <div className="space-y-3">
          <p className="text-sm">{translateMedicalText(result.storageInstructions, lang)}</p>
          <div className="rounded-xl bg-trust-soft/40 p-3 text-xs text-trust">
            <p className="font-semibold">Tip</p>
            Keep all medicines out of the sight and reach of children. Do not use after
            the expiry date printed on the packaging.
          </div>
        </div>
      );

    case "sources":
      return (
        <div className="space-y-2">
          {result.sources.map((src, i) => (
            <a
              key={i}
              href={src.url || "#"}
              target={src.url ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="flex items-center justify-between rounded-xl border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-trust/40 hover:bg-trust-soft/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{src.label}</p>
                {src.url && (
                  <p className="truncate text-[11px] text-muted-foreground">{src.url}</p>
                )}
              </div>
              <ExternalLink className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
      );

    default:
      return null;
  }
}
