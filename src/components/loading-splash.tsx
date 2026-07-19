"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/logo";

/**
 * Full-screen loading splash with the animated logo + throbber.
 * Used during auth state resolution and other transitions.
 */
export function LoadingSplash({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <Logo size={64} animated showPulse />
        <div className="throbber throbber-lg mt-8" />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-sm font-medium text-muted-foreground"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

/**
 * Transition overlay — shown briefly when navigating between screens.
 * Fades in with the logo, then fades out.
 */
export function TransitionOverlay({ show, message = "Loading…" }: { show: boolean; message?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm"
        >
          <Logo size={48} animated showPulse />
          <div className="throbber mt-6" />
          <p className="mt-3 text-xs font-medium text-muted-foreground">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
