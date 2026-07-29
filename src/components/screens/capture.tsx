"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  X, Camera, Sparkles, Search, Loader2, Pill, Upload, Image as ImageIcon,
  CheckCircle2, ShieldCheck,
} from "lucide-react";
import { useAppStore, buildScanRecord } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { captureNativePhoto, triggerHapticFeedback } from "@/lib/native-mobile";
import { toast } from "sonner";

interface Photo { id: string; dataUrl: string; }

/**
 * Compress a photo data URL so it's small enough to send to the server.
 * - Resizes to max 1024x1024 (preserving aspect ratio)
 * - Re-encodes as JPEG at 80% quality
 * - Returns a data URL typically under ~200 KB
 *
 * This prevents the "Unexpected token '<'" error that happens when a large
 * photo causes the server to return an HTML error page instead of JSON.
 */
async function compressPhoto(dataUrl: string, maxSize = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(dataUrl); return; }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const COMMON = [
  "Tylenol", "Advil", "Aspirin", "Aleve", "Benadryl", "Claritin",
  "Zyrtec", "Mucinex", "Amoxicillin", "Metformin", "Lipitor",
  "Prilosec", "Hydrocortisone", "Neosporin", "Vitamin C", "Melatonin",
  "Ibuprofen", "Acetaminophen", "Omeprazole", "Lisinopril",
  "Losartan", "Sertraline", "Levothyroxine", "Azithromycin",
  "Prednisone", "Gabapentin", "Cetirizine", "Naproxen",
];

export function CaptureScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const setPendingPhotos = useAppStore((s) => s.setPendingPhotos);
  const isPro = useAppStore((s) => s.isPro);
  const scansRemaining = useAppStore((s) => s.scansRemaining);
  const { user } = useAuth();
  const [name, setName] = React.useState("");
  const [strength, setStrength] = React.useState("");
  const [unit, setUnit] = React.useState("mg");
  const [form, setForm] = React.useState("tablet");
  const [photo, setPhoto] = React.useState<Photo | null>(null);
  const [aiSearching, setAiSearching] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const cameraRef = React.useRef<HTMLInputElement | null>(null);
  const galleryRef = React.useRef<HTMLInputElement | null>(null);

  function processDropFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please drop a valid image file");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result !== "string") return;
      compressPhoto(r.result).then((compressed) => {
        setPhoto({ id: `p-${Date.now()}`, dataUrl: compressed });
        toast.success("Image dropped & loaded!");
      });
    };
    r.readAsDataURL(file);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    // Read the file, then compress it before storing
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result !== "string") return;
      compressPhoto(r.result).then((compressed) => {
        setPhoto({ id: `p-${Date.now()}`, dataUrl: compressed });
      });
    };
    r.readAsDataURL(f);
    e.target.value = "";
  }

  const canSearch = !!photo || name.trim().length > 0;

  function buildQuery() {
    let q = name.trim();
    if (strength.trim()) q += ` ${strength.trim()}${unit}`;
    return q.trim();
  }
  /**
   * Supplementary details for the AI prompt.
   *
   * Only include strength/form when a name was actually entered. Sending
   * "tablet" or "solution" on its own made the server treat the dosage form
   * as the search term, and openFDA returns a confident unrelated product for
   * such words (this is what surfaced "Sodium Chloride" for arbitrary photos).
   */
  function buildInfo() {
    const n = name.trim();
    if (!n) return "";
    const p: string[] = [n];
    if (strength.trim()) p.push(`${strength.trim()} ${unit}`);
    if (form) p.push(form);
    return p.join(" ");
  }

  async function searchAI() {
    if (!canSearch) { setError("Upload a photo or enter a medicine name"); return; }

    // Check daily scan limit
    const canScanNow = useAppStore.getState().canScan();
    const remaining = useAppStore.getState().scansRemaining();
    const isProUser = useAppStore.getState().isPro;
    if (!canScanNow) {
      const limit = isProUser ? 4 : 1;
      setError(
        `You've used all ${limit} scans for today. ${isProUser ? "Come back tomorrow or upgrade your plan." : "Upgrade to Pro for 4 scans/day."}`
      );
      return;
    }

    setAiSearching(true); setError(null);
    // Photo is already compressed in handleFile, but double-check size
    const photos = photo ? [photo.dataUrl] : [];
    setPendingPhotos(photos);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocrText: buildInfo(), query: name.trim() || undefined, photos }),
      });
      // SAFE JSON parsing — prevents "Unexpected token '<'" when the server
      // returns an HTML error page (e.g. 413 body too large, 500 server error)
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[ai-search] non-JSON response:", res.status, text.slice(0, 200));
        if (res.status === 413) {
          throw new Error("Photo too large. Try a smaller image or use verified sources.");
        }
        throw new Error(`Server returned ${res.status}. Please try again or use verified sources.`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "AI search failed");
      // Record the scan for daily limit tracking
      useAppStore.getState().recordScan();
      const rec = buildScanRecord(json.result, photos, "camera");
      useAppStore.getState().addScan(rec);
      useAppStore.getState().setCurrentResult(json.result, rec.id);
      navigate("results");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI search failed";
      if (msg.includes("timeout") || msg.includes("timed out")) {
        setError("AI timed out. Try verified sources instead.");
      } else {
        setError(`AI error: ${msg.slice(0, 150)}`);
      }
    } finally { setAiSearching(false); }
  }

  function searchVerified() {
    if (!name.trim()) { setError("Enter a medicine name for verified sources"); return; }
    setError(null);
    setPendingPhotos(photo ? [photo.dataUrl] : []);
    navigate("analyzing", { query: buildQuery(), shape: undefined, color: undefined });
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">Identify</p>
          <h1 className="font-display text-xl font-bold leading-tight">Medicine Info</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Scan counter badge */}
          <div className={cn(
            "rounded-full px-3 py-1.5 text-[11px] font-medium",
            scansRemaining() > 0
              ? (isPro ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")
              : "bg-danger-soft text-danger"
          )}>
            {isPro ? "Pro" : "Free"} · {scansRemaining()} scan{scansRemaining() === 1 ? "" : "s"} left today
          </div>
        </div>
      </div>

      {/* Photo upload / Drag and Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const droppedFile = e.dataTransfer.files?.[0];
          if (droppedFile) processDropFile(droppedFile);
        }}
        className={cn(
          "relative rounded-2xl transition-all p-1",
          isDragging && "ring-4 ring-primary/40 bg-primary/5 scale-[1.01]"
        )}
      >
        <Label className="mb-2.5 block text-xs font-medium text-muted-foreground">
          Step 1 — Upload or drag & drop a photo (AI identifies automatically)
        </Label>
        {photo ? (
          <motion.div key="preview" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block">
            <img src={photo.dataUrl} alt="Medicine photo" className="h-28 w-28 rounded-lg border border-border object-cover shadow-soft" />
            <button onClick={() => setPhoto(null)} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-soft">
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-safe text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </motion.div>
        ) : (
          <motion.div key="buttons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-3">
            <button
              onClick={async () => {
                void triggerHapticFeedback();
                const nativeImg = await captureNativePhoto();
                if (nativeImg) {
                  const compressed = await compressPhoto(nativeImg);
                  setPhoto({ id: `p-${Date.now()}`, dataUrl: compressed });
                } else {
                  cameraRef.current?.click();
                }
              }}
              className="group flex h-24 flex-col items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-primary/5 text-primary transition-all hover:border-primary/50 hover:bg-primary/10 active:scale-95"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-transform group-hover:scale-110">
                <Camera className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Take Photo</span>
            </button>
            <button
              onClick={() => {
                void triggerHapticFeedback();
                galleryRef.current?.click();
              }}
              className="group flex h-24 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-all hover:border-primary/30 hover:text-primary active:scale-95"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-transform group-hover:scale-110">
                <ImageIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">{isDragging ? "Drop File Here" : "Upload / Drag & Drop"}</span>
            </button>
          </motion.div>
        )}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">or enter manually</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Name */}
      <div>
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Step 2 — Medicine name (optional with photo)</Label>
        <div className="relative">
          <Pill className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tylenol, Ibuprofen" className="h-11 rounded-lg pl-10" />
        </div>
      </div>

      {/* Strength + unit */}
      <div className="grid grid-cols-[1fr_90px] gap-2">
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Strength</Label>
          <Input value={strength} onChange={e => setStrength(e.target.value)} placeholder="500" className="h-11 rounded-lg" inputMode="decimal" />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Unit</Label>
          <Select value={unit} onValueChange={setUnit}>
            <SelectTrigger className="h-11 rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mg">mg</SelectItem><SelectItem value="mcg">mcg</SelectItem>
              <SelectItem value="ml">ml</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="%">%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Form */}
      <div>
        <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Form</Label>
        <Select value={form} onValueChange={setForm}>
          <SelectTrigger className="h-11 rounded-lg"><SelectValue placeholder="—" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="tablet">Tablet</SelectItem><SelectItem value="capsule">Capsule</SelectItem>
            <SelectItem value="syrup">Syrup</SelectItem><SelectItem value="cream">Cream</SelectItem>
            <SelectItem value="drops">Drops</SelectItem><SelectItem value="injection">Injection</SelectItem>
            <SelectItem value="inhaler">Inhaler</SelectItem><SelectItem value="powder">Powder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick pick */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Smart Recommendations — tap to pre-fill:</p>
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[9px] font-bold text-primary uppercase">
            10,000+ Ready
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COMMON.map(n => (
            <button key={n} onClick={() => setName(n)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                name.toLowerCase() === n.toLowerCase() ? "bg-primary text-white" : "bg-muted text-primary hover:bg-primary/10")}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-danger-soft p-3 text-xs text-danger">
          {error}
        </motion.div>
      )}

      {/* Action buttons */}
      <div className="space-y-2">
        <Button onClick={searchAI} disabled={!canSearch || aiSearching} className="h-12 w-full rounded-lg text-sm font-semibold">
          {aiSearching ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />AI is analyzing...</> : <><Sparkles className="mr-2 h-4 w-4" />{photo ? "AI Scan Photo" : "Search with AI"}</>}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Looking to browse medicines for free? Check the <button onClick={() => navigate("browse")} className="font-medium text-primary hover:underline">Browse</button> tab.
        </p>
      </div>

      {/* AI scanning overlay — background visible, throbber covers page */}
      {aiSearching && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="rounded-3xl bg-white/90 px-12 py-10 shadow-lifted">
            <div className="throbber throbber-lg mx-auto" />
            <p className="mt-4 text-center text-sm font-medium text-muted-foreground">AI is analyzing the medicine…</p>
            <p className="mt-1 text-center text-[11px] text-muted-foreground/70">This may take a few seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
