"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_CLASS: Record<Size, string> = {
  xs: "throbber-xs",
  sm: "throbber-sm",
  md: "",
  lg: "throbber-lg",
  xl: "throbber-xl",
};

const SIZE_PX: Record<Size, number> = { xs: 14, sm: 20, md: 32, lg: 48, xl: 72 };
const TRACK_PX: Record<Size, number> = { xs: 2, sm: 2.5, md: 3, lg: 4, xl: 5 };

/**
 * Primary loading indicator — a tapered conic ring over a faint static track.
 * Reads as smoother than a border spinner because the stroke fades out.
 */
export function Throbber({
  size = "md",
  className,
  track = true,
  dual = false,
  label = "Loading",
}: {
  size?: Size;
  className?: string;
  /** Draw the faint 360° track behind the moving arc. */
  track?: boolean;
  /** Add a counter-rotating inner ring. */
  dual?: boolean;
  label?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <span
      role="status"
      aria-label={label}
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: px, height: px }}
    >
      {track && (
        <span
          aria-hidden
          className="throbber-track absolute inset-0"
          style={{ borderWidth: TRACK_PX[size] }}
        />
      )}
      <span
        aria-hidden
        className={cn("throbber", SIZE_CLASS[size], dual && "throbber-dual")}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Three bouncing dots. Inherits `currentColor` — good inside buttons. */
export function DotsThrobber({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("dots-throbber", className)}>
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Equalizer bars — used for audio/voice and "streaming" states. */
export function BarsThrobber({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("bars-throbber", className)}>
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
      <span aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/**
 * Determinate progress ring. Animates the stroke via `strokeDashoffset` so it
 * can represent real progress (0–100) rather than an indefinite spin.
 */
export function ProgressRing({
  value,
  size = 72,
  thickness = 5,
  className,
  children,
}: {
  value: number;
  size?: number;
  thickness?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          className="text-primary/12"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          className="text-primary"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - clamped / 100) }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      )}
    </div>
  );
}

/**
 * Brand loader: a pharmaceutical capsule that fills with primary colour while
 * concentric radar rings expand outward. Used on full-screen waits.
 */
export function CapsuleThrobber({ size = 64, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    >
      <span aria-hidden className="ping-ring" />
      <span aria-hidden className="ping-ring ping-ring-2" />
      <span aria-hidden className="ping-ring ping-ring-3" />

      <div
        aria-hidden
        className="relative overflow-hidden rounded-full border-2 border-primary/30 bg-primary/5"
        style={{ width: size * 0.66, height: size * 0.34, transform: "rotate(-45deg)" }}
      >
        <motion.span
          className="absolute inset-y-0 left-0 bg-primary"
          animate={{ width: ["0%", "100%", "100%", "0%"] }}
          transition={{ duration: 2.2, times: [0, 0.45, 0.65, 1], repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/40" />
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

/**
 * Inline "working" text with a shimmer wash. Pair with a Throbber to give a
 * wait state two independent motion cues.
 */
export function WorkingLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("text-shimmer font-semibold", className)}>{children}</span>;
}
