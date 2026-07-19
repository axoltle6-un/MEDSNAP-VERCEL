"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ShieldAlert, X } from "lucide-react";
import { useAppStore } from "@/lib/store";

/**
 * Persistent, dismissible-after-ack disclaimer banner.
 * Shows on every screen where the tab bar is visible, until the user
 * has acknowledged it once. Re-appears if the user resets onboarding.
 */
export function DisclaimerBanner() {
  const acknowledged = useAppStore((s) => s.disclaimerAcknowledged);
  const acknowledge = useAppStore((s) => s.acknowledgeDisclaimer);
  const navigate = useAppStore((s) => s.navigate);
  const screen = useAppStore((s) => s.screen);

  // Don't render on onboarding/paywall — they have their own disclaimer moment
  if (
    acknowledged ||
    screen === "onboarding" ||
    screen === "paywall" ||
    screen === "capture" ||
    screen === "analyzing"
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative z-30 border-b border-warn/20 bg-warn-soft/60 px-4 py-2 text-[12.5px] leading-snug text-warn-foreground"
      )}
      role="note"
      aria-label="Medical disclaimer"
    >
      <div className="mx-auto flex max-w-6xl items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" strokeWidth={2.2} />
        <p className="flex-1">
          General information only — not medical advice. Always consult a doctor or
          pharmacist before starting, stopping, or changing any medication.{" "}
          <button
            onClick={() => navigate("legal-disclaimer")}
            className="font-semibold underline underline-offset-2 hover:text-warn"
          >
            Read full disclaimer
          </button>
        </p>
        <button
          onClick={acknowledge}
          aria-label="Dismiss disclaimer"
          className="rounded-full p-1 text-warn-foreground/70 transition-colors hover:bg-warn/20 hover:text-warn-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
