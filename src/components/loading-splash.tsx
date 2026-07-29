"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Logo } from "@/components/brand/logo";
import { Throbber, DotsThrobber, WorkingLabel } from "@/components/ui/throbber";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Full-screen loading splash. Layers four independent motion cues so the wait
 * never looks frozen: radar rings behind the mark, a conic throbber ring
 * around it, a shimmering label, and an indeterminate progress hairline.
 */
export function LoadingSplash({
  message = "Loading…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();

  // Surface a hint if the app is stuck loading, rather than spinning forever
  // with no explanation.
  const [stalled, setStalled] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setStalled(true), 7000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={cn(
        "relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-background px-5",
        className
      )}
    >
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="aurora-blob left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 bg-primary/10" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative flex flex-col items-center"
      >
        {/* Mark wrapped in radar rings + orbiting ring */}
        <div className="relative flex h-28 w-28 items-center justify-center">
          {!reduced && (
            <>
              <span aria-hidden className="ping-ring" />
              <span aria-hidden className="ping-ring ping-ring-2" />
              <span aria-hidden className="ping-ring ping-ring-3" />
            </>
          )}
          <Throbber size="xl" dual className="absolute" label={message} />
          <Logo size={44} animated showPulse />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35, ease: EASE }}
          className="mt-6 font-display text-xl font-extrabold tracking-tight"
        >
          Med<span className="gradient-text">Snap</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 flex items-center gap-2"
        >
          <WorkingLabel className="text-sm">{message}</WorkingLabel>
          <DotsThrobber className="text-primary" label={message} />
        </motion.div>

        {/* Indeterminate progress hairline */}
        <div
          aria-hidden
          className="relative mt-7 h-1 w-44 overflow-hidden rounded-full bg-primary/10"
        >
          <motion.span
            className="absolute inset-y-0 w-1/3 rounded-full bg-primary"
            animate={reduced ? { opacity: [0.4, 1, 0.4] } : { x: ["-110%", "330%"] }}
            transition={{
              duration: reduced ? 1.8 : 1.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <AnimatePresence>
          {stalled && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="mt-4 max-w-[15rem] text-center text-[11px] leading-relaxed text-muted-foreground/80"
            >
              Still loading — check your connection, or refresh the page.
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/**
 * Transition overlay — shown briefly on top of existing content when handing
 * off between screens. Blurs the page behind it rather than replacing it.
 */
export function TransitionOverlay({
  show,
  message = "Loading…",
}: {
  show: boolean;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25, ease: EASE }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/85"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="flex flex-col items-center"
          >
            <div className="relative flex h-20 w-20 items-center justify-center">
              <span aria-hidden className="ping-ring" />
              <span aria-hidden className="ping-ring ping-ring-2" />
              <Throbber size="lg" className="absolute" label={message} />
              <Logo size={30} animated />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <WorkingLabel className="text-xs">{message}</WorkingLabel>
              <DotsThrobber className="text-primary" label={message} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline block-level loader for panels and lists that are still resolving.
 */
export function InlineLoader({
  message = "Loading…",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-12", className)}>
      <Throbber size="lg" dual label={message} />
      <WorkingLabel className="text-xs">{message}</WorkingLabel>
    </div>
  );
}
