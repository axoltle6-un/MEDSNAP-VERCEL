"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Search as SearchIcon,
  Loader2,
  ChevronRight,
  Sparkles,
  Pill,
  X,
  FlaskConical,
} from "lucide-react";
import { useAppStore, searchMedicines, buildScanRecord } from "@/lib/store";
import { MEDICINE_DB } from "@/lib/medicine-db";
import {
  MedicineThumb,
  formLabel,
  ConfidenceBadge,
} from "@/components/medicine/primitives";
import type { MedicineResult } from "@/lib/types";
import { VoiceSearchButton } from "@/components/ui/voice-search-button";
import { getTranslation } from "@/lib/translations";

export function SearchScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const goBack = useAppStore((s) => s.goBack);
  const screenParams = useAppStore((s) => s.screenParams);
  const addScan = useAppStore((s) => s.addScan);
  const setCurrentResult = useAppStore((s) => s.setCurrentResult);
  const setPendingPhotos = useAppStore((s) => s.setPendingPhotos);
  const lang = useAppStore((s) => s.settings.language);

  const initialQuery = (screenParams["initialQuery"] as string) ?? "";
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<MedicineResult[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const didAutoRunRef = React.useRef<string | null>(null);

  const suggestions = React.useMemo(() => {
    if (!query.trim()) return [];
    return searchMedicines(query, 6);
  }, [query]);

  // Auto-run search when navigated with an initialQuery (e.g. from Home)
  React.useEffect(() => {
    const q = (screenParams["initialQuery"] as string) ?? "";
    if (q && q.trim() && didAutoRunRef.current !== q) {
      didAutoRunRef.current = q;
      setQuery(q);
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenParams]);

  async function runSearch(q: string) {
    const term = q.trim();
    if (!term) return;
    setQuery(term);
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      });
      // Safe JSON parsing — handle HTML error pages gracefully
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        console.error("[search] non-JSON response:", res.status);
        throw new Error(`Server returned ${res.status}. Please try again.`);
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Search failed");
      setResults(json.results ?? []);
    } catch (err) {
      console.error("[search] failed:", err);
      setResults([]);
      const { toast } = await import("sonner");
      toast.error(
        err instanceof Error
          ? `Search failed: ${err.message}`
          : "Search failed — please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function openResult(m: MedicineResult) {
    // Drop leftover camera photos so they don't leak into this search result.
    setPendingPhotos([]);
    const record = buildScanRecord(m, [], "search", m.brandName);
    addScan(record);
    setCurrentResult(m, record.id);
    navigate("results");
  }

  return (
    <div className="flex flex-col gap-4 py-2 md:py-4">
      <div className="flex items-center gap-2">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-soft"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-[22px] font-bold leading-tight">Search medicines</h1>
          <p className="text-xs text-muted-foreground">By name, generic, or drug class</p>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="relative flex items-center"
      >
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getTranslation(lang, "searchPlaceholder")}
          className="h-12 rounded-2xl pl-11 pr-12 shadow-soft"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults(null);
                setSearched(false);
              }}
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

      {/* Live DB suggestions */}
      {!searched && suggestions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Suggestions
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {suggestions.map((m) => (
              <button
                key={m.id}
                onClick={() => openResult(m)}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-soft transition-all hover:border-foreground/30 hover:shadow-lifted"
              >
                <MedicineThumb result={m} compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{m.brandName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.genericName} · {m.strengthDisplay}
                  </p>
                  {m.drugClass && (
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground/70">
                      {m.drugClass}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No query — browse all */}
      {!searched && suggestions.length === 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Browse common medicines
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {MEDICINE_DB.map((m) => (
              <button
                key={m.id}
                onClick={() => openResult(m)}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3 text-left shadow-soft transition-all hover:border-foreground/30 hover:shadow-lifted"
              >
                <MedicineThumb result={m} compact />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{(m?.brandName || "Unknown").split(" / ")[0]}</p>
                    <span className="shrink-0 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background">
                      {m.strengthDisplay}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {(m?.genericName || "").split("(")[0].trim()}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <span className="flex items-center gap-0.5">
                      <FlaskConical className="h-2.5 w-2.5" />
                      {formLabel(m.form)}
                    </span>
                    {m.drugClass && (
                      <span className="truncate">· {m.drugClass}</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="flex items-center gap-3 border-border/60 p-5 shadow-soft">
          <Loader2 className="h-5 w-5 animate-spin text-foreground" />
          <p className="text-sm text-muted-foreground">Searching medicines…</p>
        </Card>
      )}

      {/* Search results */}
      <AnimatePresence>
        {!loading && searched && results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2.5"
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {results.length} result{results.length === 1 ? "" : "s"} for "{query}"
            </p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {results.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => openResult(m)}
                  className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-soft transition-all hover:border-foreground/30 hover:shadow-lifted"
                >
                  <MedicineThumb result={m} compact />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{m.brandName}</p>
                      <ConfidenceBadge confidence={m.confidence} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{m.genericName}</p>
                    <p className="mt-1 text-sm font-bold text-foreground">{m.strengthDisplay}</p>
                    {m.matchNote && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                        {m.matchNote}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {!loading && searched && results && results.length === 0 && (
          <Card className="border-dashed border-border/70 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Pill className="h-6 w-6" />
            </div>
            <p className="mt-3 font-semibold">No matches found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different spelling or the generic name (e.g. "acetaminophen" instead
              of "Tylenol").
            </p>
            <Button onClick={() => navigate("capture")} className="mt-4 rounded-xl">
              Scan a photo instead
            </Button>
          </Card>
        )}
      </AnimatePresence>
    </div>
  );
}
