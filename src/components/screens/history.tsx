"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash2,
  Download,
  ChevronRight,
  History as HistoryIcon,
  Filter,
  X,
  Star,
  Tag,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Activity,
  Syringe,
  Pill,
  Sparkles,
  Layers,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { MedicineThumb } from "@/components/medicine/primitives";
import { formatRelative } from "@/lib/format";
import type { ScanRecord } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type QuickTimeFilter = "all" | "today" | "week" | "month" | "favorites";
type ViewMode = "grid" | "timeline";

const TAG_PRESETS = ["Diabetes", "Heart", "Dental", "Child", "Annual Checkup"];

export function HistoryScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const scans = useAppStore((s) => s.scans);
  const deleteScan = useAppStore((s) => s.deleteScan);
  const restoreScan = useAppStore((s) => s.restoreScan);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const getScan = useAppStore((s) => s.getScan);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const [query, setQuery] = React.useState("");
  const [timeFilter, setTimeFilter] = React.useState<QuickTimeFilter>("all");
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");

  // Filter scans by query, quick time window, tag, and favorites
  const filtered = React.useMemo(() => {
    const now = Date.now();
    const oneDay = 86400000;
    const oneWeek = 86400000 * 7;
    const oneMonth = 86400000 * 30;

    return scans.filter((s) => {
      // Time filter
      if (timeFilter === "today" && now - s.createdAt > oneDay) return false;
      if (timeFilter === "week" && now - s.createdAt > oneWeek) return false;
      if (timeFilter === "month" && now - s.createdAt > oneMonth) return false;
      if (timeFilter === "favorites" && !s.isFavorite) return false;

      // Tag filter
      if (selectedTag && !(s.tags || []).includes(selectedTag)) return false;

      // Text query
      if (!query.trim()) return true;
      const q = (query || "").toLowerCase();
      const med = s.medicine;
      if (!med) return false;
      return (
        (med.brandName || "").toLowerCase().includes(q) ||
        (med.genericName || "").toLowerCase().includes(q) ||
        (med.activeIngredients || []).some((i) => (i || "").toLowerCase().includes(q)) ||
        (s.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [scans, query, timeFilter, selectedTag]);

  const grouped = groupByDay(filtered);

  function openScan(id: string) {
    const scan = getScan(id);
    if (!scan) return;
    useAppStore.setState({
      currentResult: scan.medicine,
      currentScanId: scan.id,
    });
    navigate("results");
  }

  function handleDeleteScan(s: ScanRecord) {
    deleteScan(s.id);
    toast("Scan removed from history", {
      description: `${s.medicine.brandName} has been deleted.`,
      action: {
        label: "Undo",
        onClick: () => {
          restoreScan(s);
          toast.success("Scan restored!");
        },
      },
      duration: 5000,
    });
  }

  function exportHistory() {
    const rows = [
      ["Date", "Brand", "Generic", "Strength", "Form", "Source", "Favorite", "Notes"].join(","),
      ...filtered.map((s) =>
        [
          new Date(s.createdAt).toISOString(),
          `"${s.medicine.brandName}"`,
          `"${s.medicine.genericName}"`,
          s.medicine.strengthDisplay,
          s.medicine.form,
          s.source,
          s.isFavorite ? "Yes" : "No",
          `"${(s.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medsnap-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? "" : "s"} to CSV`);
  }

  return (
    <div className="flex flex-col gap-4 py-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold leading-tight">Medical History</h1>
          <p className="text-xs text-muted-foreground">
            {scans.length} record{scans.length === 1 ? "" : "s"} on file
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "grid" ? "bg-white text-primary shadow-soft" : "text-muted-foreground"
              )}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
                viewMode === "timeline" ? "bg-white text-primary shadow-soft" : "text-muted-foreground"
              )}
            >
              Timeline
            </button>
          </div>

          <Button
            onClick={exportHistory}
            disabled={filtered.length === 0}
            variant="outline"
            size="sm"
            className="h-9 rounded-xl"
          >
            <Download className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Export</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-xl"
                disabled={scans.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all medical scan history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every saved record from your account. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  onClick={() => {
                    clearHistory();
                    toast.success("Scan history cleared");
                  }}
                >
                  Clear all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, ingredient, tag, or note..."
          className="h-11 rounded-2xl pl-11 pr-10 shadow-soft"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick Time Filters */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar md:mx-0 md:px-0">
        {[
          { id: "all" as const, label: "All Records" },
          { id: "today" as const, label: "Today" },
          { id: "week" as const, label: "This Week" },
          { id: "month" as const, label: "This Month" },
          { id: "favorites" as const, label: "⭐ Pinned Favorites" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setTimeFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              timeFilter === f.id
                ? "bg-primary text-white shadow-soft"
                : "bg-white border border-border/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Medical Category Color Badges Key */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground font-medium pt-1">
        <span className="font-bold uppercase tracking-wider text-slate-400">Record Categories:</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-blue-700 font-semibold">
          🟦 Lab Reports
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700 font-semibold">
          🟩 Prescriptions
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-700 font-semibold">
          🟨 Vaccines
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-rose-700 font-semibold">
          🟥 Emergency / High Risk
        </span>
      </div>

      {/* Tag Preset Filters */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mr-1">
          <Tag className="h-3.5 w-3.5" /> Tags:
        </span>
        {TAG_PRESETS.map((t) => {
          const active = selectedTag === t;
          return (
            <button
              key={t}
              onClick={() => setSelectedTag(active ? null : t)}
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all",
                active
                  ? "bg-slate-900 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              #{t}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-border/70 p-8 text-center shadow-soft rounded-2xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground">
            <HistoryIcon className="h-6 w-6" />
          </div>
          <p className="mt-3 font-semibold text-base">
            {scans.length === 0 ? "No records yet" : "No matching records found"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
            {scans.length === 0
              ? "Scan a pill or search for a medication to save your first clinical entry."
              : "Try adjusting your time filter or search query."}
          </p>
          {scans.length === 0 && (
            <Button
              onClick={() => navigate("capture")}
              className="mt-4 rounded-xl font-bold shadow-soft"
            >
              Scan a medicine
            </Button>
          )}
        </Card>
      ) : viewMode === "grid" ? (
        /* Card Grid View */
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="mb-2 font-display text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {group.label}
              </p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                  {group.items.map((s) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ScanRow
                        scan={s}
                        onOpen={() => openScan(s.id)}
                        onDelete={() => handleDeleteScan(s)}
                        onToggleFavorite={() => toggleFavorite(s.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Timeline Chronological View */
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/80">
          <AnimatePresence initial={false}>
            {filtered.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="relative"
              >
                {/* Timeline node dot */}
                <div className="absolute -left-6 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-primary">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>

                <div className="rounded-2xl border border-border/60 bg-white p-4 shadow-soft hover:shadow-lifted transition-all">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" />
                      {new Date(s.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(s.id)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star className={cn("h-4 w-4", s.isFavorite && "fill-amber-400")} />
                      </button>
                      <button
                        onClick={() => handleDeleteScan(s)}
                        className="p-1 text-muted-foreground hover:text-danger transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    onClick={() => openScan(s.id)}
                    className="mt-3 flex items-center gap-3 cursor-pointer"
                  >
                    <MedicineThumb result={s.medicine} compact />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm truncate">{s.medicine?.brandName || "Unknown"}</h4>
                        <DocBadge scan={s} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{(s.medicine?.genericName || "").split("(")[0].trim()} · {s.medicine?.strengthDisplay || ""}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function ScanRow({
  scan,
  onOpen,
  onDelete,
  onToggleFavorite,
}: {
  scan: ScanRecord;
  onOpen: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}) {
  const brandName = (scan.medicine?.brandName || "Unknown").split(" / ")[0];
  const genericName = (scan.medicine?.genericName || "").split("(")[0].trim();
  const strengthDisplay = scan.medicine?.strengthDisplay || "";

  return (
    <div className="group relative flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-white p-3.5 shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted">
      <button onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted border border-border/60">
          {scan.photos[0] ? (
            <img
              src={scan.photos[0]}
              alt={brandName}
              className="h-full w-full object-cover"
            />
          ) : (
            <MedicineThumb result={scan.medicine} compact />
          )}
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {brandName}
            </p>
            <DocBadge scan={scan} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {genericName} {strengthDisplay ? `· ${strengthDisplay}` : ""}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {formatRelative(scan.createdAt)}
          </p>
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onToggleFavorite}
          className="flex h-8 w-8 items-center justify-center rounded-full text-amber-400 hover:scale-110 transition-transform"
          aria-label="Pin Favorite"
        >
          <Star className={cn("h-4 w-4", scan.isFavorite && "fill-amber-400")} />
        </button>
        <button
          onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
          aria-label="Delete scan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DocBadge({ scan }: { scan: ScanRecord }) {
  if (scan.medicine?.highRisk || scan.medicine?.controlledSubstance) {
    return (
      <span className="shrink-0 rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[9px] font-bold text-rose-700">
        Emergency
      </span>
    );
  }
  if (scan.source === "search") {
    return (
      <span className="shrink-0 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[9px] font-bold text-blue-700">
        Lab DB
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
      Rx Order
    </span>
  );
}

function groupByDay(scans: ScanRecord[]) {
  const groups: { label: string; items: ScanRecord[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);

  for (const s of scans) {
    const d = new Date(s.createdAt);
    d.setHours(0, 0, 0, 0);
    let label: string;
    if (d.getTime() === today.getTime()) label = "Today";
    else if (d.getTime() === yesterday.getTime()) label = "Yesterday";
    else
      label = d.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

    let g = groups.find((x) => x.label === label);
    if (!g) {
      g = { label, items: [] };
      groups.push(g);
    }
    g.items.push(s);
  }
  return groups;
}
