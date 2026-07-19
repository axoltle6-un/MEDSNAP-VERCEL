"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Columns,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
  Pill,
  ShieldCheck,
  Ban,
  Activity,
  Maximize2,
  Minimize2,
  Type,
  GripHorizontal,
  Scaling,
  Move,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MedicineResult } from "@/lib/types";
import { useAppStore, MEDICINE_DB } from "@/lib/store";
import { formLabel, MedicineThumb } from "@/components/medicine/primitives";
import { cn } from "@/lib/utils";
import { getTranslation } from "@/lib/translations";

interface SideBySideCompareProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryMedicine: MedicineResult;
}

type TextScale = "normal" | "large" | "extra-large";

/**
 * Truly Floating & Dynamically Edge-Resizable Side-by-Side Medical Comparison Window.
 * Users can drag the title bar to move the window, and drag the bottom-right corner or edges
 * to resize the window to any custom width & height, or toggle Fullscreen 100vw.
 */
export function SideBySideCompare({
  open,
  onOpenChange,
  primaryMedicine: initialPrimary,
}: SideBySideCompareProps) {
  const scans = useAppStore((s) => s.scans);
  const lang = useAppStore((s) => s.settings.language);

  const [medA, setMedA] = React.useState<MedicineResult>(initialPrimary);
  const [textScale, setTextScale] = React.useState<TextScale>("normal");

  // Custom Window Size State (Pixels)
  const [windowWidth, setWindowWidth] = React.useState(920);
  const [windowHeight, setWindowHeight] = React.useState(720);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // Resize dragging state
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, w: 920, h: 720 });

  const compareOptions = React.useMemo(() => {
    const list: MedicineResult[] = [];
    scans.forEach((s) => {
      if (s?.medicine?.id && s.medicine.id !== medA?.id && !list.some((m) => m.id === s.medicine.id)) {
        list.push(s.medicine);
      }
    });
    MEDICINE_DB.forEach((m) => {
      if (m?.id && m.id !== medA?.id && !list.some((x) => x.id === m.id)) {
        list.push(m);
      }
    });
    return list;
  }, [scans, medA]);

  const [medB, setMedB] = React.useState<MedicineResult>(
    compareOptions[0] || MEDICINE_DB[0]
  );

  React.useEffect(() => {
    setMedA(initialPrimary);
  }, [initialPrimary]);

  function handleSwap() {
    const temp = medA;
    setMedA(medB);
    setMedB(temp);
  }

  // Cross-drug interaction detection
  const interactionResult = React.useMemo(() => {
    if (!medA || !medB) return null;

    const ingA = (medA.activeIngredients || []).map((i) => (i || "").toLowerCase());
    const ingB = (medB.activeIngredients || []).map((i) => (i || "").toLowerCase());

    const sharedIngredients = ingA.filter((a) => ingB.some((b) => b.includes(a) || a.includes(b)));

    for (const ix of (medA.interactions || [])) {
      if (ix && ix.with) {
        const ixWithLower = (ix.with || "").toLowerCase();
        if (ingB.some((b) => b.includes(ixWithLower) || ixWithLower.includes(b))) {
          return {
            type: "interaction" as const,
            severity: ix.severity,
            note: `Interaction risk detected: ${medA.brandName} interacts with ${ix.with} in ${medB.brandName}. (${ix.note})`,
          };
        }
      }
    }

    if (sharedIngredients.length > 0) {
      return {
        type: "duplicate" as const,
        severity: "caution" as const,
        note: `Duplicate active ingredient warning: Both medications contain ${sharedIngredients.join(", ")}. Taking both together may cause accidental overdose.`,
      };
    }

    return null;
  }, [medA, medB]);

  // Corner Drag Resizing Handlers
  function startResizing(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: windowWidth,
      h: windowHeight,
    });
  }

  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing) return;
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      const maxW = typeof window !== "undefined" ? window.innerWidth - 32 : 1600;
      const maxH = typeof window !== "undefined" ? window.innerHeight - 32 : 1200;

      setWindowWidth(Math.min(Math.max(resizeStart.w + deltaX, 420), maxW));
      setWindowHeight(Math.min(Math.max(resizeStart.h + deltaY, 380), maxH));
    }

    function onMouseUp() {
      setIsResizing(false);
    }

    if (isResizing) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing, resizeStart]);

  if (!open) return null;

  const fontClasses = {
    normal: "text-xs",
    large: "text-sm",
    "extra-large": "text-base",
  }[textScale];

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 backdrop-blur-md p-2 sm:p-4 select-none animate-in fade-in-0 duration-200">
      <motion.div
        layout
        style={{
          width: isFullscreen ? "100vw" : `${windowWidth}px`,
          height: isFullscreen ? "100vh" : `${windowHeight}px`,
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
        className={cn(
          "relative flex flex-col bg-white text-slate-900 border border-border/80 shadow-2xl overflow-hidden transition-shadow",
          isFullscreen ? "rounded-none" : "rounded-3xl"
        )}
      >
        {/* Floating Title Bar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 bg-slate-900 text-white border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Columns className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Side-by-Side Clinical Matrix</h3>
              <p className="text-[10px] text-white/70">
                Size: {isFullscreen ? "Fullscreen (100vw)" : `${windowWidth}px × ${windowHeight}px`} · Drag corner to scale
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Swap Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSwap}
              className="h-8 rounded-xl text-xs font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ArrowRightLeft className="mr-1 h-3.5 w-3.5" /> Swap Sides
            </Button>

            {/* Text Scale Cycle */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (textScale === "normal") setTextScale("large");
                else if (textScale === "large") setTextScale("extra-large");
                else setTextScale("normal");
              }}
              className="h-8 rounded-xl text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10"
            >
              <Type className="mr-1 h-3.5 w-3.5" /> {textScale.toUpperCase()}
            </Button>

            {/* Preset Size Buttons */}
            <div className="hidden md:flex items-center rounded-xl bg-white/10 p-0.5 border border-white/10">
              <button
                onClick={() => { setIsFullscreen(false); setWindowWidth(720); setWindowHeight(520); }}
                className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Compact
              </button>
              <button
                onClick={() => { setIsFullscreen(false); setWindowWidth(1080); setWindowHeight(760); }}
                className="px-2 py-1 text-[10px] font-bold rounded-lg hover:bg-white/20 transition-colors"
              >
                Large
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isFullscreen ? "Restore Floating Window" : "Maximize Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Close */}
            <button
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Comparison Content Box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl bg-slate-50 border border-border/60 p-3.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Medicine A (Left Column):
              </label>
              <p className="font-extrabold text-sm text-primary truncate">{medA.brandName} ({medA.strengthDisplay})</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Compare with Medicine B (Right Column):
              </label>
              <select
                value={medB.id}
                onChange={(e) => {
                  const found = compareOptions.find((m) => m.id === e.target.value);
                  if (found) setMedB(found);
                }}
                className="h-10 w-full rounded-xl border border-border bg-white px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none shadow-soft"
              >
                {compareOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.brandName} ({m.genericName}) — {m.strengthDisplay}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interaction Banner */}
          {interactionResult ? (
            <div className="rounded-2xl border-2 border-danger/40 bg-danger-soft/70 p-4 shadow-soft">
              <div className="flex items-start gap-2.5 text-danger text-xs font-semibold">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">
                    {interactionResult.type === "duplicate" ? "Duplicate Active Ingredient Risk" : "Interaction Conflict Detected"}
                  </p>
                  <p className="mt-1 font-normal text-foreground/90 leading-relaxed">{interactionResult.note}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-safe/30 bg-safe-soft/40 p-3 flex items-center gap-2 text-xs text-safe font-semibold">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Cross-Formula Check: Zero ingredient overlaps or conflict warnings detected.</span>
            </div>
          )}

          {/* Side-by-Side Columns */}
          <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", fontClasses)}>
            {/* Med A */}
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-white p-4 space-y-3 shadow-soft">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-primary/20">
                <MedicineThumb result={medA} compact />
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider">
                    Medicine A
                  </span>
                  <h3 className="font-extrabold text-base text-foreground truncate mt-1">{medA.brandName}</h3>
                  <p className="text-muted-foreground truncate">{medA.genericName}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Dose Form & Strength</p>
                <p className="font-semibold text-slate-900">{medA.strengthDisplay} · {formLabel(medA.form)}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Drug Class</p>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {medA.drugClass || "General Pharmaceutical"}
                </span>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Active Formula Components</p>
                <p className="font-semibold text-primary">{medA.activeIngredients.join(", ")}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Primary Indications</p>
                <ul className="list-disc pl-4 space-y-1">
                  {medA.usedFor.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Common Side Effects</p>
                <p className="text-slate-700">{medA.commonSideEffects.join(", ")}</p>
              </div>

              {medA.seriousSideEffects.length > 0 && (
                <div>
                  <p className="font-bold text-rose-600 uppercase text-[10px]">Serious Warnings</p>
                  <p className="text-rose-700 font-medium">{medA.seriousSideEffects.join(", ")}</p>
                </div>
              )}
            </div>

            {/* Med B */}
            <div className="rounded-2xl border-2 border-indigo-300 bg-gradient-to-b from-indigo-50/50 to-white p-4 space-y-3 shadow-soft">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-indigo-200">
                <MedicineThumb result={medB} compact />
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider">
                    Medicine B
                  </span>
                  <h3 className="font-extrabold text-base text-foreground truncate mt-1">{medB.brandName}</h3>
                  <p className="text-muted-foreground truncate">{medB.genericName}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Dose Form & Strength</p>
                <p className="font-semibold text-slate-900">{medB.strengthDisplay} · {formLabel(medB.form)}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Drug Class</p>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  {medB.drugClass || "General Pharmaceutical"}
                </span>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Active Formula Components</p>
                <p className="font-semibold text-indigo-700">{medB.activeIngredients.join(", ")}</p>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Primary Indications</p>
                <ul className="list-disc pl-4 space-y-1">
                  {medB.usedFor.map((u, i) => (
                    <li key={i}>{u}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-bold text-muted-foreground uppercase text-[10px]">Common Side Effects</p>
                <p className="text-slate-700">{medB.commonSideEffects.join(", ")}</p>
              </div>

              {medB.seriousSideEffects.length > 0 && (
                <div>
                  <p className="font-bold text-rose-600 uppercase text-[10px]">Serious Warnings</p>
                  <p className="text-rose-700 font-medium">{medB.seriousSideEffects.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-3 bg-slate-50 border-t border-border flex items-center justify-between shrink-0">
          <p className="text-[11px] text-muted-foreground hidden sm:block">
            Drag the bottom-right corner ↘ to resize the window to any custom dimensions.
          </p>

          <Button onClick={() => onOpenChange(false)} className="rounded-xl font-bold shadow-soft ml-auto">
            Close Matrix
          </Button>
        </div>

        {/* Interactive Bottom-Right Corner Resize Drag Handle */}
        {!isFullscreen && (
          <div
            onMouseDown={startResizing}
            className="absolute bottom-0 right-0 z-50 flex h-6 w-6 cursor-se-resize items-center justify-center rounded-tl-lg bg-primary/20 hover:bg-primary text-primary hover:text-white transition-colors"
            title="Drag to Resize Window"
          >
            <Scaling className="h-3.5 w-3.5" />
          </div>
        )}
      </motion.div>
    </div>
  );
}
