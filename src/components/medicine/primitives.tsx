"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Pill,
  PillBottle,
  Droplet,
  Syringe,
  TestTube2,
  Wind,
  Stethoscope,
  CircleHelp,
  FlaskConical,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { Confidence, MedicineForm, MedicineResult } from "@/lib/types";
import { MedicineIllustration } from "@/components/medicine/illustration";

export const FORM_ICONS: Record<MedicineForm, LucideIcon> = {
  tablet: Pill,
  capsule: PillBottle,
  syrup: Droplet,
  injection: Syringe,
  cream: TestTube2,
  drops: Droplet,
  inhaler: Wind,
  patch: Package,
  suppository: Pill,
  powder: FlaskConical,
  unknown: CircleHelp,
};

export function formLabel(form: MedicineForm): string {
  const labels: Record<MedicineForm, string> = {
    tablet: "Tablet",
    capsule: "Capsule",
    syrup: "Syrup",
    injection: "Injection",
    cream: "Cream",
    drops: "Drops",
    inhaler: "Inhaler",
    patch: "Patch",
    suppository: "Suppository",
    powder: "Powder",
    unknown: "Unknown form",
  };
  return labels[form] ?? "Unknown form";
}

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const content =
    confidence === "high"
      ? "Verified against official drug database records & high vision model score."
      : confidence === "medium"
        ? "Partial match identified. Review active ingredients and specs."
        : "Low confidence identification. Double check with physical packaging insert.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          {confidence === "high" && (
            <Badge className="bg-safe-soft text-safe border-safe/30 hover:bg-safe-soft cursor-help">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-safe" />
              High confidence
            </Badge>
          )}
          {confidence === "medium" && (
            <Badge className="bg-warn-soft text-warn-foreground border-warn/30 hover:bg-warn-soft cursor-help">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-warn" />
              Possible match
            </Badge>
          )}
          {confidence === "low" && (
            <Badge className="bg-danger-soft text-danger border-danger/30 hover:bg-danger-soft cursor-help">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-danger" />
              Low confidence
            </Badge>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-slate-900 text-white p-2 text-[11px] rounded-xl shadow-lifted">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

export function FormIcon({
  form,
  className,
}: {
  form: MedicineForm;
  className?: string;
}) {
  const Icon = FORM_ICONS[form] ?? CircleHelp;
  return <Icon className={cn("h-5 w-5", className)} strokeWidth={2} />;
}

/** Compact medicine thumbnail — uses real NIH/Wikipedia image if available,
 *  falls back to SVG illustration, then form icon. */
export function MedicineThumb({
  result,
  compact = false,
  className,
}: {
  result: MedicineResult;
  compact?: boolean;
  className?: string;
}) {
  // Show real image if available — proxied through our server to avoid CORS
  if (result.imageUrl) {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(result.imageUrl)}`;
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white border border-border/60 shadow-soft",
          compact ? "h-12 w-12" : "h-20 w-20",
          className
        )}
      >
        <img
          src={proxyUrl}
          alt={result.brandName}
          className="h-full w-full object-contain p-0.5"
          loading="lazy"
          onError={(e) => {
            // On image load error, hide broken image tag and show form icon background
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement?.classList.add("bg-muted");
          }}
        />
      </div>
    );
  }
  if (result.appearance) {
    return (
      <MedicineIllustration
        form={result.form}
        appearance={result.appearance}
        compact={compact}
        className={cn("shrink-0", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground border border-border/60 shadow-soft",
        compact ? "h-12 w-12" : "h-20 w-20",
        className
      )}
    >
      <FormIcon form={result.form} className={compact ? "h-5 w-5 text-muted-foreground" : "h-7 w-7 text-muted-foreground"} />
    </div>
  );
}

export function StrengthDisplay({
  result,
  size = "lg",
}: {
  result: MedicineResult;
  size?: "sm" | "lg";
}) {
  if (size === "sm") {
    return (
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-foreground tabular-nums">
          {result.strengthDisplay}
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Strength
      </span>
      <span className="text-5xl font-bold leading-none tracking-tight text-foreground tabular-nums">
        {result.strengthValue}
      </span>
      <span className="mt-1 text-lg font-semibold text-muted-foreground">
        {result.strengthUnit}
      </span>
    </div>
  );
}

export function MedicineIdentity({
  result,
  compact = false,
}: {
  result: MedicineResult;
  compact?: boolean;
}) {
  const Icon = FORM_ICONS[result.form] ?? Stethoscope;
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground",
          compact ? "h-10 w-10" : "h-14 w-14"
        )}
      >
        <Icon className={compact ? "h-5 w-5" : "h-7 w-7"} strokeWidth={2.1} />
      </div>
      <div className="min-w-0 flex-1">
        <h2
          className={cn(
            "font-bold leading-tight text-foreground text-balance",
            compact ? "text-base" : "text-xl"
          )}
        >
          {result.brandName}
        </h2>
        <p
          className={cn(
            "text-muted-foreground leading-snug",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {result.genericName}
        </p>
        {result.manufacturer && !compact && (
          <p className="mt-1 text-xs text-muted-foreground/80">
            {result.manufacturer}
          </p>
        )}
      </div>
    </div>
  );
}
