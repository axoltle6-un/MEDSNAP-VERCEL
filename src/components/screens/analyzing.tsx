"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore, buildScanRecord } from "@/lib/store";
import { ScanLine, Eye, Search, ShieldCheck, X, Database } from "lucide-react";
import type { MedicineResult } from "@/lib/types";

const STAGES = [
  { label: "Searching openFDA database…", icon: Database },
  { label: "Checking RxNorm (NIH)…", icon: Search },
  { label: "Verifying with DailyMed…", icon: ShieldCheck },
] as const;

export function AnalyzingScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const pendingPhotos = useAppStore((s) => s.pendingPhotos);
  const screenParams = useAppStore((s) => s.screenParams);
  const addScan = useAppStore((s) => s.addScan);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);

  const [stageIdx, setStageIdx] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const startedRef = React.useRef(false);

  const query = (screenParams["query"] as string) || "";
  const shape = (screenParams["shape"] as string) || undefined;
  const color = (screenParams["color"] as string) || undefined;

  React.useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    async function run() {
      const stageTimer = setInterval(() => {
        if (cancelled) return;
        setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
      }, 800);

      try {
        if (!query) {
          navigate("home");
          return;
        }

        const res = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            shape,
            color,
            photos: pendingPhotos,
          }),
        });
        if (cancelled) return;
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
        setStageIdx(STAGES.length - 1);
        setTimeout(() => {
          if (!cancelled) navigate("results");
        }, 400);
      } catch (err) {
        if (cancelled) return;
        console.error("[analyzing] scan failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while identifying the medicine."
        );
      } finally {
        clearInterval(stageTimer);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6">
      <button
        onClick={goBack}
        aria-label="Cancel"
        className="absolute right-4 top-4 z-20 rounded-full p-2 text-muted-foreground hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex flex-col items-center">
        <div className="throbber throbber-lg" />

        <div className="mt-8 w-full max-w-xs space-y-2.5">
          <p className="mb-1 text-center text-sm font-medium text-muted-foreground">
            {query ? `Searching for "${query}"` : "Searching…"}
          </p>
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const state =
              i < stageIdx ? "done" : i === stageIdx ? "active" : "pending";
            return (
              <motion.div
                key={stage.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: i <= stageIdx ? 1 : 0.35, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border px-4 py-2.5 transition-colors",
                  state === "active"
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl",
                    state === "done"
                      ? "bg-safe-soft text-safe"
                      : state === "active"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {state === "done" ? (
                    <motion.svg
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                  ) : state === "active" ? (
                    <Icon className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    state === "active" ? "text-foreground" : "text-muted-foreground"
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 w-full max-w-xs rounded-2xl bg-danger-soft p-4 text-center"
            >
              <p className="text-sm font-semibold text-danger">Couldn't identify</p>
              <p className="mt-1 text-xs text-danger/80">{error}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate("capture")}
                  className="flex-1 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-danger-foreground"
                >
                  Try again
                </button>
                <button
                  onClick={() => navigate("home")}
                  className="flex-1 rounded-xl bg-card px-3 py-2 text-xs font-semibold"
                >
                  Go home
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!error && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Searching verified government databases.
            <br />
            openFDA · RxNorm · DailyMed
          </p>
        )}
      </div>
    </div>
  );
}
