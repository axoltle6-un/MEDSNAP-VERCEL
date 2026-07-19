"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { MedicineForm, PillAppearance } from "@/lib/types";

interface Props {
  form: MedicineForm;
  appearance?: PillAppearance;
  className?: string;
  /** Show a subtle shadow under the pill */
  shadow?: boolean;
  /** Compact mode for small list thumbnails */
  compact?: boolean;
}

/**
 * Data-driven SVG illustration of a medicine.
 * Renders different shapes (round, oval, capsule, caplet, bottle, inhaler)
 * based on the appearance data from the medicine DB.
 */
export function MedicineIllustration({
  form,
  appearance,
  className,
  shadow = true,
  compact = false,
}: Props) {
  const shape = appearance?.shape ?? defaultShape(form);
  const color = appearance?.color ?? "#E5E5E5";
  const colorSecondary = appearance?.colorSecondary ?? "#FFFFFF";
  const hasScore = appearance?.hasScore ?? false;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-muted/40 to-muted/10",
        compact ? "h-12 w-12" : "h-20 w-20",
        className
      )}
    >
      <svg
        viewBox="0 0 100 100"
        className={cn(compact ? "h-9 w-9" : "h-14 w-14")}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`grad-${shape}-${color.slice(1)}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={darken(color, 0.15)} stopOpacity="1" />
          </linearGradient>
          <radialGradient id={`shine-${shape}`} cx="0.3" cy="0.3" r="0.4">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {shadow && (
          <ellipse
            cx="50"
            cy="85"
            rx="28"
            ry="4"
            fill="#000000"
            opacity="0.12"
          />
        )}

        {renderShape(shape, color, colorSecondary, hasScore)}

        {/* Shine overlay */}
        <ellipse cx="38" cy="35" rx="14" ry="8" fill={`url(#shine-${shape})`} />
      </svg>
    </div>
  );
}

function renderShape(
  shape: PillAppearance["shape"],
  color: string,
  colorSecondary: string,
  hasScore: boolean
): React.ReactNode {
  const gradId = `grad-${shape}-${color.slice(1)}`;

  switch (shape) {
    case "round":
      return (
        <>
          <circle cx="50" cy="50" r="28" fill={`url(#${gradId})`} stroke={darken(color, 0.25)} strokeWidth="1" />
          {hasScore && (
            <line x1="50" y1="28" x2="50" y2="72" stroke={darken(color, 0.4)} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          )}
        </>
      );

    case "oval":
    case "caplet":
      return (
        <>
          <rect
            x="22"
            y="38"
            width="56"
            height="24"
            rx="12"
            fill={`url(#${gradId})`}
            stroke={darken(color, 0.25)}
            strokeWidth="1"
          />
          {hasScore && (
            <line x1="50" y1="40" x2="50" y2="60" stroke={darken(color, 0.4)} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          )}
        </>
      );

    case "capsule":
      // Two-tone capsule: left half one color, right half another
      return (
        <>
          <defs>
            <clipPath id={`capsule-clip-${color.slice(1)}`}>
              <rect x="22" y="36" width="56" height="28" rx="14" />
            </clipPath>
          </defs>
          <g clipPath={`url(#capsule-clip-${color.slice(1)})`}>
            <rect x="22" y="36" width="28" height="28" fill={color} />
            <rect x="50" y="36" width="28" height="28" fill={colorSecondary} />
            <line x1="50" y1="36" x2="50" y2="64" stroke="#000000" strokeWidth="0.5" opacity="0.2" />
          </g>
          <rect
            x="22"
            y="36"
            width="56"
            height="28"
            rx="14"
            fill="none"
            stroke="#000000"
            strokeWidth="0.5"
            opacity="0.15"
          />
        </>
      );

    case "inhaler":
      return (
        <>
          {/* Inhaler body */}
          <rect x="35" y="20" width="30" height="50" rx="6" fill={color} stroke={darken(color, 0.25)} strokeWidth="1" />
          {/* Mouthpiece */}
          <rect x="40" y="68" width="20" height="12" rx="3" fill={darken(color, 0.3)} />
          {/* Cap */}
          <rect x="33" y="16" width="34" height="8" rx="4" fill={darken(color, 0.2)} />
          {/* Label line */}
          <rect x="38" y="38" width="24" height="3" rx="1" fill="#FFFFFF" opacity="0.5" />
          <rect x="38" y="45" width="20" height="2" rx="1" fill="#FFFFFF" opacity="0.4" />
        </>
      );

    case "bottle":
      return (
        <>
          {/* Bottle body */}
          <rect x="30" y="30" width="40" height="50" rx="6" fill={color} stroke={darken(color, 0.25)} strokeWidth="1" />
          {/* Cap */}
          <rect x="34" y="18" width="32" height="14" rx="3" fill={darken(color, 0.3)} />
          {/* Label */}
          <rect x="33" y="48" width="34" height="18" rx="2" fill="#FFFFFF" opacity="0.85" />
          <rect x="38" y="52" width="20" height="2" rx="1" fill={color} opacity="0.6" />
          <rect x="38" y="57" width="14" height="2" rx="1" fill={color} opacity="0.5" />
        </>
      );

    case "tube":
      return (
        <>
          {/* Tube body */}
          <rect x="36" y="30" width="28" height="55" rx="4" fill={color} stroke={darken(color, 0.25)} strokeWidth="1" />
          {/* Cap */}
          <rect x="40" y="18" width="20" height="14" rx="3" fill={darken(color, 0.3)} />
          {/* Label stripe */}
          <rect x="36" y="48" width="28" height="14" fill="#FFFFFF" opacity="0.7" />
        </>
      );

    case "irregular":
    default:
      return (
        <circle cx="50" cy="50" r="26" fill={color} stroke={darken(color, 0.25)} strokeWidth="1" opacity="0.8" />
      );
  }
}

function defaultShape(form: MedicineForm): PillAppearance["shape"] {
  switch (form) {
    case "tablet":
      return "round";
    case "capsule":
      return "capsule";
    case "syrup":
      return "bottle";
    case "injection":
      return "tube";
    case "cream":
      return "tube";
    case "drops":
      return "bottle";
    case "inhaler":
      return "inhaler";
    case "patch":
      return "round";
    case "suppository":
      return "oval";
    case "powder":
      return "bottle";
    default:
      return "round";
  }
}

/** Darken a hex color by a factor (0-1) */
function darken(hex: string, factor: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.round(r * (1 - factor));
  g = Math.round(g * (1 - factor));
  b = Math.round(b * (1 - factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
