"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Search as SearchIcon,
  ChevronRight,
  Pill,
  Compass,
  ShieldCheck,
  X,
  ExternalLink,
  Database,
  Globe,
} from "lucide-react";
import { useAppStore, buildScanRecord } from "@/lib/store";
import { safeFetch } from "@/lib/safe-fetch";
import {
  MedicineThumb,
  formLabel,
} from "@/components/medicine/primitives";
import type { MedicineResult } from "@/lib/types";
import { toast } from "sonner";
import { VoiceSearchButton } from "@/components/ui/voice-search-button";
import { getTranslation } from "@/lib/translations";

export function BrowseScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const addScan = useAppStore((s) => s.addScan);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const lang = useAppStore((s) => s.settings.language);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<MedicineResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [fetchingReport, setFetchingReport] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const [source, setSource] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "fda" | "nih" | "drap" | "nmpa">("all");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  // Search global, Pakistani (DRAP), and Chinese (NMPA) databases
  async function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setSearched(true);
    setResults([]);
    setSource("");

    try {
      const result = await safeFetch<{ results: MedicineResult[]; source: string }>("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });

      if (!result.ok) throw new Error(result.error || "Search failed");

      const data = result.data;
      setResults(data?.results ?? []);
      setSource(data?.source || "verified");

      if ((data?.results ?? []).length === 0) {
        toast.info("No results found in global, DRAP, or NMPA registries. Try another spelling.");
      }
    } catch (err) {
      console.error("[browse] failed:", err);
      setResults([]);
      toast.error("Could not reach medical databases. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  // Click a result → fetch FULL report from databases
  async function openResult(m: MedicineResult) {
    setFetchingReport(true);
    toast.info("Fetching full verified report from international medical databases…");

    try {
      const result = await safeFetch<{ result: MedicineResult }>(
        `/api/search?query=${encodeURIComponent((m?.brandName || "Unknown").split(" / ")[0])}`,
        { method: "GET" }
      );

      if (result.ok && result.data?.result) {
        const fullReport = result.data.result;
        const record = buildScanRecord(fullReport, [], "search", m.brandName);
        addScan(record);
        setCurrentResult(fullReport, record.id);
        navigate("results");
      } else {
        const record = buildScanRecord(m, [], "search", m.brandName);
        addScan(record);
        setCurrentResult(m, record.id);
        navigate("results");
      }
    } catch {
      const record = buildScanRecord(m, [], "search", m.brandName);
      addScan(record);
      setCurrentResult(m, record.id);
      navigate("results");
    } finally {
      setFetchingReport(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 py-2 md:py-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-display text-xl font-bold leading-tight">Browse medicines</h1>
            <p className="text-xs text-muted-foreground">Global, DRAP (Pakistan) & NMPA (China) drug registries</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
        className="relative flex items-center"
      >
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getTranslation(lang, "searchPlaceholder")}
          className="h-12 rounded-2xl border-border bg-white pl-11 pr-12 shadow-soft transition-shadow focus:shadow-lifted"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); setResults([]); setSearched(false); setSource(""); }}
              className="rounded-full p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <VoiceSearchButton
            onTranscript={(text) => {
              setQuery(text);
              runSearch(text);
            }}
          />
        </div>
      </form>

      {/* Free badge */}
      <div className="flex items-center gap-2 rounded-xl bg-safe-soft/50 p-2.5 text-xs text-safe">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span><strong>Verified Sources</strong> · openFDA (US) · DRAP (Pakistan) · NMPA (China) · RxNorm · PubChem</span>
      </div>

      {/* Filter buttons */}
      {searched && results.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all" as const, label: "All Registries" },
              { id: "fda" as const, label: "openFDA (US)" },
              { id: "nih" as const, label: "NIH / RxNorm" },
              { id: "drap" as const, label: "🇵🇰 DRAP (Pakistan)" },
              { id: "nmpa" as const, label: "🇨🇳 NMPA (China)" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Forms" },
              { id: "tablet", label: "Tablets" },
              { id: "capsule", label: "Capsules" },
              { id: "syrup", label: "Liquid/Syrup" },
              { id: "cream", label: "Cream/Topical" },
              { id: "injection", label: "Injection" },
              { id: "inhaler", label: "Inhaler" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setTypeFilter(f.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  typeFilter === f.id
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="rounded-3xl bg-white/90 px-12 py-10 shadow-lifted text-center">
            <div className="throbber throbber-lg mx-auto" />
            <p className="mt-4 text-sm font-medium text-muted-foreground">Searching Global, DRAP & NMPA Registries…</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">openFDA</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">🇵🇰 DRAP Pakistan</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">🇨🇳 NMPA China</span>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">NIH PubChem</span>
            </div>
          </div>
        </div>
      )}

      {/* Fetching full report overlay */}
      {fetchingReport && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
          <div className="rounded-3xl bg-white/90 px-12 py-10 shadow-lifted">
            <div className="throbber throbber-lg mx-auto" />
            <p className="mt-4 text-center text-sm font-medium text-muted-foreground">Generating full report with MedSnap AI…</p>
          </div>
        </div>
      )}

      {/* Search results */}
      {!loading && searched && results.length > 0 && (() => {
        const filtered = results.filter(r => {
          if (filter !== "all") {
            const srcs = (r?.sources || []).map(s => (s?.label || "").toLowerCase());
            if (filter === "fda" && !srcs.some(s => s.includes("fda"))) return false;
            if (filter === "nih" && !srcs.some(s => s.includes("nih") || s.includes("rxnorm") || s.includes("pubchem"))) return false;
            if (filter === "drap" && !srcs.some(s => s.includes("drap") || s.includes("pakistan"))) return false;
            if (filter === "nmpa" && !srcs.some(s => s.includes("nmpa") || s.includes("china") || s.includes("pharmacopoeia"))) return false;
          }
          if (typeFilter !== "all") {
            const form = (r?.form || "").toLowerCase();
            const name = ((r?.brandName || "") + " " + (r?.genericName || "") + " " + (r?.activeIngredients || []).join(" ")).toLowerCase();
            if (typeFilter === "tablet" && !form.includes("tablet") && !name.includes("tablet")) return false;
            if (typeFilter === "capsule" && !form.includes("capsule") && !name.includes("capsule")) return false;
            if (typeFilter === "syrup" && !form.includes("syrup") && !form.includes("suspension") && !name.includes("syrup") && !name.includes("liquid")) return false;
            if (typeFilter === "cream" && !form.includes("cream") && !form.includes("ointment")) return false;
            if (typeFilter === "injection" && !form.includes("injection")) return false;
            if (typeFilter === "inhaler" && !form.includes("inhaler")) return false;
          }
          return true;
        });

        if (filtered.length === 0) {
          return (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center shadow-soft">
              <p className="font-semibold">No medicines match this filter</p>
              <p className="mt-1 text-sm text-muted-foreground">Try selecting "All Registries" or searching another term.</p>
            </div>
          );
        }

        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {filtered.length} medicine{filtered.length === 1 ? "" : "s"} found
              </p>
              <span className="flex items-center gap-1 rounded-full bg-safe-soft/50 px-2.5 py-0.5 text-[10px] font-medium text-safe">
                <ShieldCheck className="h-3 w-3" />
                Verified Registry
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((m, i) => (
                <motion.button
                  key={m.id || i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openResult(m)}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted"
                >
                  <MedicineThumb result={m} compact />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{m.brandName}</p>
                      <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                        {m.strengthDisplay}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{(m?.genericName || "").split("(")[0].trim()}</p>
                    {m.manufacturer && <p className="truncate text-[10px] text-muted-foreground/60">{m.manufacturer}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground/70">
                      {m.form && m.form !== "unknown" && <span className="rounded bg-muted px-1.5 py-0.5">{formLabel(m.form)}</span>}
                      {m.drugClass && <span className="truncate">{m.drugClass}</span>}
                    </div>
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {m.sources.slice(0, 2).map((src, j) => (
                          <span key={j} className="flex items-center gap-0.5 rounded bg-safe-soft/30 px-1.5 py-0.5 text-[9px] font-medium text-safe">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            {(src?.label || "").split("(")[0].trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ))}
            </div>

            {/* Direct database query links */}
            <div className="mt-4 rounded-xl bg-muted/40 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Direct Database Queries</p>
              <div className="flex flex-wrap gap-2">
                <a href={`https://open.fda.gov/search/endpoint/?search=openfda.brand_name:${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-primary shadow-soft hover:bg-muted">
                  <ExternalLink className="h-3 w-3" /> openFDA
                </a>
                <a href="https://www.drap.gov.pk" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-primary shadow-soft hover:bg-muted">
                  <ExternalLink className="h-3 w-3" /> 🇵🇰 DRAP (Pakistan)
                </a>
                <a href="https://www.nmpa.gov.cn" target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-primary shadow-soft hover:bg-muted">
                  <ExternalLink className="h-3 w-3" /> 🇨🇳 NMPA (China)
                </a>
                <a href={`https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-primary shadow-soft hover:bg-muted">
                  <ExternalLink className="h-3 w-3" /> PubChem
                </a>
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-white p-5 text-center shadow-soft">
            <Database className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Search International Drug Registries</h2>
            <p className="mt-1 text-sm text-muted-foreground">Cross-referenced live across global, Pakistani, and Chinese medical authorities:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="flex items-center gap-1 rounded-full bg-safe-soft/40 px-3 py-1.5 text-xs font-medium text-safe"><ShieldCheck className="h-3 w-3" /> openFDA (USA)</span>
              <span className="flex items-center gap-1 rounded-full bg-safe-soft/40 px-3 py-1.5 text-xs font-medium text-safe"><ShieldCheck className="h-3 w-3" /> 🇵🇰 DRAP (Pakistan)</span>
              <span className="flex items-center gap-1 rounded-full bg-safe-soft/40 px-3 py-1.5 text-xs font-medium text-safe"><ShieldCheck className="h-3 w-3" /> 🇨🇳 NMPA (China)</span>
              <span className="flex items-center gap-1 rounded-full bg-safe-soft/40 px-3 py-1.5 text-xs font-medium text-safe"><ShieldCheck className="h-3 w-3" /> RxNorm / PubChem</span>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Popular regional searches</p>
            <div className="flex flex-wrap gap-2">
              {[
                "Panadol",
                "Arinac",
                "Risek",
                "Ponstan",
                "Lianhua Qingwen",
                "Yunnan Baiyao",
                "Piba Gao",
                "Ibuprofen",
                "Amoxicillin",
              ].map(name => (
                <button key={name} onClick={() => runSearch(name)} className="rounded-full border border-border/60 bg-card px-3.5 py-1.5 text-xs font-medium text-foreground shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted">{name}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
