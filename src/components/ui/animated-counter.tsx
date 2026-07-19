"use client";

import * as React from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Premium Animated Number Counter component.
 * Smoothly interpolates numeric values using Framer Motion springs for that high-end fintech feel.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  className = "",
}: AnimatedCounterProps) {
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 22,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  React.useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}
