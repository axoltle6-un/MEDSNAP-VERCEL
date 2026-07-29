"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ScanLine,
  Search,
  ChevronRight,
  Clock,
  Pill,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Camera,
  ArrowRight,
  Activity,
  Globe,
} from "lucide-react";
import { useAppStore, browseMedicines } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  MedicineThumb,
  formLabel,
} from "@/components/medicine/primitives";
import { Logo } from "@/components/brand/logo";
import { formatRelative } from "@/lib/format";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { VoiceSearchButton } from "@/components/ui/voice-search-button";
import { Star, Bell, Calendar, Check, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { getTranslation } from "@/lib/translations";

export function HomeScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const scans = useAppStore((s) => s.scans);
  const profile = useAppStore((s) => s.profile);
  const getScan = useAppStore((s) => s.getScan);
  const lang = useAppStore((s) => s.settings.language);
  const { user } = useAuth();

  const recent = scans.slice(0, 4);
  const [query, setQuery] = React.useState("");

  const greeting = useGreeting();
  const userName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  // Popular list is a browse/discovery listing, not a search result.
  const popular = React.useMemo(() => browseMedicines(8), []);

  function openScan(id: string) {
    const scan = getScan(id);
    if (!scan) return;
    useAppStore.setState({ currentResult: scan.medicine, currentScanId: scan.id });
    navigate("results");
  }

  function submitSearch() {
    if (!query.trim()) return;
    navigate("search", { initialQuery: query });
  }

  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Mobile header */}
      <header className="flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <Logo size={42} animated showPulse />
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">{greeting}, {userName} 👋</p>
            <h1 className="font-display text-xl font-bold leading-tight">
              Med<span className="text-primary">Snap</span>
            </h1>
          </div>
        </div>
        <button
          onClick={() => navigate("settings")}
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-white text-muted-foreground shadow-soft transition-all hover:text-primary hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-5 w-5 text-primary" />
        </button>
      </header>

      {/* Desktop header */}
      <div className="hidden md:block">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-display text-3xl font-extrabold leading-tight"
        >
          {greeting}, {userName} 👋{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-600 to-blue-500 bg-clip-text text-transparent">
            Identify any medicine.
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mt-1 text-sm text-slate-600"
        >
          Upload a photo or search by name — verified across global, DRAP & NMPA registries.
        </motion.p>
      </div>

      {/* Search bar with Voice Search */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
        className="relative flex items-center"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getTranslation(lang, "searchPlaceholder")}
          className="h-12 rounded-2xl border-border/80 bg-white pl-11 pr-12 shadow-soft transition-all focus:shadow-lifted focus:border-primary/40"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
          <VoiceSearchButton
            onTranscript={(text) => {
              setQuery(text);
              navigate("search", { initialQuery: text });
            }}
          />
        </div>
      </motion.form>

      {/* Main Scan CTA Card */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        onClick={() => navigate("capture")}
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-blue-600 p-5 text-left shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15 blur-2xl transition-transform group-hover:scale-150" />
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-soft">
          <Camera className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <div className="relative flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">AI Vision Engine</p>
          <p className="text-lg font-bold text-white leading-tight">Scan a medicine</p>
          <p className="text-xs text-white/80 mt-0.5">Take a photo to identify instantly</p>
        </div>
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform group-hover:translate-x-1">
          <ArrowRight className="h-5 w-5" />
        </div>
      </motion.button>

      {/* Allergy warning banner */}
      {(profile.allergies?.length ?? 0) > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft/50 p-3.5 shadow-soft">
          <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-danger" />
          <p className="flex-1 text-xs text-danger font-medium leading-relaxed">
            <strong>{profile.allergies?.length} allerg{(profile.allergies?.length ?? 0) > 1 ? "ies" : "y"}</strong> on file: {profile.allergies?.join(", ")}. Active checks run on every scan.
          </p>
        </div>
      )}

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard label={getTranslation(lang, "cloudHistory")} value={String(scans.length)} icon={ScanLine} onClick={() => navigate("history")} />
        <StatCard label={getTranslation(lang, "allergies")} value={String(profile.allergies?.length ?? 0)} icon={AlertTriangle} onClick={() => navigate("settings")} />
        <StatCard label={getTranslation(lang, "registries")} value="10+" icon={Globe} onClick={() => navigate("browse")} />
      </div>

      {/* Pinned Favorites */}
      {scans.some((s) => s.isFavorite) && (
        <section className="mt-1">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Pinned Favorites
            </h2>
            <button onClick={() => navigate("history")} className="text-xs font-semibold text-primary hover:underline">
              View all
            </button>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {scans.filter((s) => s.isFavorite).slice(0, 3).map((s) => (
              <button
                key={s.id}
                onClick={() => openScan(s.id)}
                className="group flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-3 text-left shadow-soft transition-all hover:border-amber-400 hover:shadow-lifted"
              >
                <MedicineThumb result={s.medicine} compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{s.medicine?.brandName || "Unknown"}</p>
                  <p className="truncate text-xs text-slate-600">{s.medicine?.genericName || ""} {s.medicine?.strengthDisplay ? `· ${s.medicine.strengthDisplay}` : ""}</p>
                </div>
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Recent Scans */}
      <section className="mt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Clock className="h-4 w-4 text-primary" /> {getTranslation(lang, "recentHistory")}
          </h2>
          {scans.length > 0 && (
            <button onClick={() => navigate("history")} className="text-xs font-semibold text-primary hover:underline">
              See all ({scans.length})
            </button>
          )}
        </div>

        {recent.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-card p-6 text-center shadow-soft rounded-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Pill className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm font-semibold">No scans recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Take a photo or search to save your first medicine report.</p>
          </Card>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((s, i) => (
              <motion.button
                key={s.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => openScan(s.id)}
                className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-white p-3 text-left shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted"
              >
                <MedicineThumb result={s.medicine} compact />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold leading-tight">{(s.medicine?.brandName || "Unknown").split(" / ")[0]}</p>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
                      {s.medicine?.strengthDisplay || ""}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">{(s.medicine?.genericName || "").split("(")[0].trim()}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/80">{formatRelative(s.createdAt)}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Common Medicines Carousel */}
      <section className="mt-1">
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <TrendingUp className="h-4 w-4 text-primary" /> {getTranslation(lang, "commonMedications")}
          </h2>
          <button onClick={() => navigate("browse")} className="text-xs font-semibold text-primary hover:underline">Browse all</button>
        </div>
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-2 no-scrollbar md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-2.5">
          {popular.map((m) => (
            <button
              key={m.id}
              onClick={() => { useAppStore.setState({ currentResult: m, currentScanId: null }); navigate("results"); }}
              className="flex w-36 shrink-0 flex-col gap-2 rounded-2xl border border-border/60 bg-white p-3.5 text-left shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted md:w-auto"
            >
              <div className="flex items-center justify-between">
                <MedicineThumb result={m} compact />
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">{m.strengthDisplay}</span>
              </div>
              <div className="mt-1">
                <p className="line-clamp-1 text-xs font-bold leading-tight">{(m?.brandName || "Unknown").split(" / ")[0]}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formLabel(m.form)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, onClick }: {
  label: string; value: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-1.5 rounded-2xl border border-border/60 bg-white p-3.5 shadow-soft transition-all hover:border-primary/30 hover:shadow-lifted active:scale-95"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-left mt-0.5">
        <p className="text-lg font-bold leading-none tabular-nums text-foreground">
          {isNaN(Number(value)) ? (
            value
          ) : (
            <AnimatedCounter value={Number(value)} />
          )}
        </p>
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">{label}</p>
      </div>
    </button>
  );
}

function useGreeting() {
  const [g, setG] = React.useState("Hello");
  React.useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setG("Good morning");
    else if (h < 18) setG("Good afternoon");
    else setG("Good evening");
  }, []);
  return g;
}
