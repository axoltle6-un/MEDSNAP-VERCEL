"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore, buildScanRecord } from "@/lib/store";
import { Search, ShieldCheck, X, Database, AlertTriangle, FileText } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ProgressRing, Throbber, WorkingLabel } from "@/components/ui/throbber";
import type { MedicineResult } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

const STAGES = [
  { label: "Reading your query", icon: Search },
  { label: "Searching openFDA database", icon: Database },
  { label: "Cross-checking RxNorm & DailyMed", icon: ShieldCheck },
  { label: "Building your report", icon: FileText },
] as const;

/**
 * Stage progression.
 *
 * Previously a setInterval advanced the checklist every 800 ms regardless of
 * what the request was doing, so the UI claimed "Verifying with DailyMed"
 * while the fetch may not have even resolved — and on a slow network it sat
 * pinned at the last stage indefinitely. Stages are now driven by the real
 * request lifecycle, with a gentle creep inside the network phase so the bar
 * never looks frozen while genuinely waiting.
 */
const PHASE = {
  START: 0,
  FETCHING: 1,
  PARSING: 2,
  DONE: 3,
} as const;

export function AnalyzingScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const pendingPhotos = useAppStore((s) => s.pendingPhotos);
  const screenParams = useAppStore((s) => s.screenParams);
  const addScan = useAppStore((s) => s.addScan);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);

  const [stageIdx, setStageIdx] = React.useState(PHASE.START);
  const [creep, setCreep] = React.useState(0);
  const [slow, setSlow] = React.useState(false);
  const reduced = useReducedMotion();
  const [complete, setComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  const query = (screenParams["query"] as string) || "";
  const shape = (screenParams["shape"] as string) || undefined;
  const color = (screenParams["color"] as string) || undefined;

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    // Reassure the user if the databases are taking a while.
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, 6000);

    async function run() {
      // Creep the sub-progress while the network call is in flight so the ring
      // keeps moving during a genuinely slow request, without ever claiming a
      // later stage has completed.
      const creepTimer = setInterval(() => {
        if (cancelled) return;
        setCreep((c) => Math.min(c + 0.035, 0.92));
      }, 260);

      try {
        if (!query) {
          navigate("home");
          return;
        }

        setStageIdx(PHASE.FETCHING);

        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, shape, color, photos: pendingPhotos }),
        });
        if (cancelled) return;

        setStageIdx(PHASE.PARSING);
        setCreep(1);

        // Safe JSON parsing — handle HTML error pages
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(`Server returned ${res.status}. Please try again.`);
        }
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json?.error || "Identification failed.");
        }

        const result = json.result as MedicineResult;
        const record = buildScanRecord(result, pendingPhotos, "camera");
        addScan(record);
        setCurrentResult(result, record.id);
        setStageIdx(PHASE.DONE);
        setComplete(true);
        setTimeout(() => {
          if (!cancelled) navigate("results");
        }, 620);
      } catch (err) {
        if (cancelled) return;
        console.error("[analyzing] scan failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while identifying the medicine."
        );
      } finally {
        clearInterval(creepTimer);
        clearTimeout(slowTimer);
      }
    }
    run();
    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, []);

  // Progress reflects the actual phase; `creep` only advances *within* the
  // network phase so a slow request still shows motion.
  const progress = complete
    ? 100
    : error
      ? 0
      : Math.round(
          ((stageIdx + (stageIdx === PHASE.FETCHING ? creep : 0.35)) /
            STAGES.length) *
            100
        );

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background px-6">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="aurora-blob left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2 bg-primary/10" />
      </div>

      <button
        onClick={goBack}
        aria-label="Cancel analysis"
        className="press absolute right-4 top-4 z-20 rounded-full border border-border bg-background/80 p-2 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex w-full max-w-xs flex-col items-center">
        {/* Radar + determinate progress ring around the brand mark */}
        <div className="relative flex h-32 w-32 items-center justify-center">
          {!error && !reduced && (
            <>
              <span aria-hidden className="ping-ring" />
              <span aria-hidden className="ping-ring ping-ring-2" />
              <span aria-hidden className="ping-ring ping-ring-3" />
            </>
          )}
          <ProgressRing value={progress} size={112} thickness={5} className="absolute" />
          <motion.div
            animate={
              complete
                ? { scale: [1, 1.16, 1] }
                : error
                  ? { scale: 1 }
                  : { scale: 1 }
            }
            transition={{ duration: 0.5, ease: EASE }}
          >
            {error ? (
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
                <AlertTriangle className="h-7 w-7" />
              </span>
            ) : (
              <Logo size={52} animated showPulse={!complete} />
            )}
          </motion.div>
        </div>

        <div className="mt-5 flex flex-col items-center gap-1 text-center">
          {error ? (
            <p className="text-sm font-bold text-danger">Analysis stopped</p>
          ) : complete ? (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-bold text-safe"
            >
              Match verified
            </motion.p>
          ) : (
            <WorkingLabel className="text-sm">Identifying your medicine…</WorkingLabel>
          )}
          {query && (
            <p className="max-w-full truncate text-xs font-medium text-muted-foreground">
              {`“${query}”`}
            </p>
          )}

          {/* Screen-reader announcement of the live stage */}
          <span aria-live="polite" className="sr-only">
            {error
              ? "Analysis stopped"
              : complete
                ? "Match verified"
                : STAGES[Math.min(stageIdx, STAGES.length - 1)].label}
          </span>

          {/* Only appears if the databases are genuinely slow */}
          <AnimatePresence>
            {slow && !complete && !error && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="mt-1 text-[11px] text-muted-foreground/80"
              >
                Government databases are responding slowly — hang tight.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Stage checklist */}
        <div className="mt-7 w-full space-y-2.5">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const state =
              error && i >= stageIdx
                ? "pending"
                : complete || i < stageIdx
                  ? "done"
                  : i === stageIdx
                    ? "active"
                    : "pending";

            return (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: state === "pending" ? 0.45 : 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.07, ease: EASE }}
                className={cn(
                  "relative flex items-center gap-3 overflow-hidden rounded-2xl border px-3.5 py-2.5 transition-colors duration-300",
                  state === "active"
                    ? "border-primary/40 bg-primary/5"
                    : state === "done"
                      ? "border-safe/30 bg-safe-soft/40"
                      : "border-border bg-card"
                )}
              >
                {/* Sweeping highlight on the active row */}
                {state === "active" && (
                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-primary/10 to-transparent"
                    animate={{ x: ["-100%", "320%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}

                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                    state === "done"
                      ? "bg-safe text-safe-foreground"
                      : state === "active"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {state === "done" ? (
                      <motion.svg
                        key="check"
                        initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 22 }}
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    ) : state === "active" ? (
                      <motion.span key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Throbber size="sm" track={false} label={stage.label} />
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Icon className="h-4 w-4" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <p
                  className={cn(
                    "relative z-10 text-sm font-medium transition-colors duration-300",
                    state === "pending" ? "text-muted-foreground" : "text-foreground"
                  )}
                >
                  {stage.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="mt-6 w-full rounded-2xl border border-danger/30 bg-danger-soft p-4 text-center"
            >
              <p className="text-sm font-bold text-danger">Couldn&apos;t identify this medicine</p>
              <p className="mt-1 text-xs leading-relaxed text-danger/80">{error}</p>
              <div className="mt-3.5 flex gap-2">
                <button
                  onClick={() => navigate("capture")}
                  className="press flex-1 rounded-xl bg-danger px-3 py-2.5 text-xs font-bold text-danger-foreground"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate("home")}
                  className="press flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-bold"
                >
                  Go home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!error && (
          <p className="mt-7 text-center text-[11px] leading-relaxed text-muted-foreground">
            Searching verified government databases
            <br />
            <span className="font-semibold">openFDA · RxNorm · DailyMed</span>
          </p>
        )}
      </div>
    </div>
  );
}
