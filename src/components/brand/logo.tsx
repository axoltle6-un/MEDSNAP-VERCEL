"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * MedSnap Brand Logo — Next-Generation Medical Vision AI Emblem.
 *
 * Design Concept:
 * - Squircle Badge with Royal Gradient (Blue ➔ Indigo).
 * - Camera Viewfinder Focus Corners (representing "Snap" & Multi-Modal Vision AI).
 * - Precision Dual-Tone Pharmaceutical Capsule (representing Medicine).
 * - Sparkling Medical Cross Star (representing Health Accuracy & AI Intelligence).
 */
export function Logo({
  size = 40,
  className,
  animated = true,
  showPulse = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
  showPulse?: boolean;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0 select-none", className)}
      style={{ width: size, height: size }}
    >
      {/* Outer Pulse Ring */}
      {showPulse && (
        <motion.span
          className="absolute inset-0 rounded-[28%] bg-primary/25"
          animate={animated ? { scale: [1, 1.45], opacity: [0.55, 0] } : {}}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {/* Main Badge Container */}
      <motion.div
        className="relative flex items-center justify-center rounded-[28%] bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-500 shadow-glow"
        style={{ width: size, height: size }}
        animate={animated ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.08, rotate: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Soft Ambient Glass Highlight */}
        <span
          className="pointer-events-none absolute inset-0 rounded-[28%]"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 65%)",
          }}
        />

        {/* Vector SVG Emblem */}
        <svg
          viewBox="0 0 36 32"
          className="relative"
          style={{ width: size * 0.65, height: size * 0.65 }}
          fill="none"
        >
          {/* Camera Scan Corners (Snap Lens) */}
          <path
            d="M5 11V7C5 5.89543 5.89543 5 7 5H11"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M25 5H29C30.1046 5 31 5.89543 31 7V11"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M31 21V25C31 26.1046 30.1046 27 29 27H25"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M11 27H7C5.89543 27 5 26.1046 5 25V21"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* Dynamic Capsule Pill (45deg rotation) */}
          <g transform="rotate(-45 18 16)">
            {/* Left Cap (Solid Pure White) */}
            <rect x="9" y="12" width="9" height="8" rx="4" fill="white" />
            {/* Right Cap (Semi-transparent Electric Blue) */}
            <rect x="18" y="12" width="9" height="8" rx="4" fill="white" fillOpacity="0.55" />
            {/* Center Separation Ring */}
            <line x1="18" y1="12" x2="18" y2="20" stroke="#0D6EFD" strokeWidth="1" strokeOpacity="0.4" />
          </g>

          {/* AI Sparkle Star (Top Right) */}
          <path
            d="M26 8L26.8 11.2L30 12L26.8 12.8L26 16L25.2 12.8L22 12L25.2 11.2L26 8Z"
            fill="#60A5FA"
          />
        </svg>
      </motion.div>
    </div>
  );
}

/**
 * Brand Logo paired with the "MedSnap" Typography Wordmark.
 */
export function LogoWordmark({
  size = 36,
  className,
  animated = true,
  showText = true,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
  showText?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <Logo size={size} animated={animated} />
      {showText && (
        <div className="leading-none text-left">
          <p className="font-display text-lg font-extrabold tracking-tight text-foreground">
            Med<span className="gradient-text">Snap</span>
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 mt-0.5">
            AI Medicine Identifier
          </p>
        </div>
      )}
    </div>
  );
}
