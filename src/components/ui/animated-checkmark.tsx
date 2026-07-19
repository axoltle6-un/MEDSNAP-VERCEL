"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface AnimatedCheckmarkProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

/**
 * Smooth SVG Animated Success Checkmark.
 * Uses Framer Motion path length drawing for a elegant check animation.
 */
export function AnimatedSuccessCheckmark({
  size = 56,
  color = "#10b981",
  strokeWidth = 3,
  className = "",
}: AnimatedCheckmarkProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <motion.path
          d="M16 26.5L22.5 33L36 19.5"
          stroke={color}
          strokeWidth={strokeWidth + 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
