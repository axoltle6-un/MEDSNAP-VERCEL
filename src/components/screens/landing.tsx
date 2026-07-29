"use client";

import * as React from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Camera,
  ShieldCheck,
  Sparkles,
  Zap,
  Pill,
  HeartPulse,
  Menu,
  X,
  ArrowRight,
  LogOut,
  User as UserIcon,
  Database,
  Check,
  Star,
  Plus,
  ScanLine,
  FileText,
  Languages,
  Quote,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Logo, LogoWordmark } from "@/components/brand/logo";
import type { Screen } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LoadingSplash } from "@/components/loading-splash";
import { Reveal, RevealGroup, RevealItem, CountUp } from "@/components/ui/reveal";
import { Throbber } from "@/components/ui/throbber";

const NAV_ITEMS = [
  { id: "hero", label: "Home" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "pricing", label: "Pricing" },
  { id: "faq", label: "FAQ" },
  { id: "about", label: "About" },
] as const;

export function LandingScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [transitioning, setTransitioning] = React.useState(false);
  const [transitionMessage, setTransitionMessage] = React.useState("Loading MedSnap…");

  const transitionTo = (target: Screen, message = "Loading MedSnap…") => {
    setTransitioning(true);
    setTransitionMessage(message);
    // Short, honest hand-off — long enough for the loader to register, not a fake wait.
    setTimeout(() => navigate(target), 420);
  };

  const handleGetStarted = () =>
    user
      ? transitionTo("home", "Opening your dashboard…")
      : transitionTo("auth", "Loading sign up…");

  const handleLogin = () =>
    user
      ? transitionTo("home", "Opening your dashboard…")
      : transitionTo("auth", "Loading sign in…");

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (transitioning) {
    return <LoadingSplash message={transitionMessage} />;
  }

  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground selection:bg-primary/15">
      <SiteNav
        user={user}
        logout={logout}
        navigate={navigate}
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
        scrollToSection={scrollToSection}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main>
        <HeroSection id="hero" onGetStarted={handleGetStarted} navigate={navigate} />
        <RegistryMarquee />
        <FeaturesSection id="features" />
        <HowItWorksSection id="how-it-works" onGetStarted={handleGetStarted} />
        <PricingSection id="pricing" onGetStarted={handleGetStarted} navigate={navigate} />
        <TestimonialsSection />
        <FAQSection id="faq" />
        <AboutSection id="about" />
        <CTASection onGetStarted={handleGetStarted} />
      </main>

      <FooterSection
        navigate={navigate}
        onLogin={handleLogin}
        onGetStarted={handleGetStarted}
        scrollToSection={scrollToSection}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation                                                          */
/* ------------------------------------------------------------------ */

function SiteNav({
  user,
  logout,
  navigate,
  onGetStarted,
  onLogin,
  scrollToSection,
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  user: ReturnType<typeof useAuth>["user"];
  logout: () => Promise<void>;
  navigate: (s: Screen) => void;
  onGetStarted: () => void;
  onLogin: () => void;
  scrollToSection: (id: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
}) {
  const activeSection = useActiveSection(NAV_ITEMS.map((i) => i.id));
  const scrolled = useScrolled(12);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "glass border-border/70 shadow-soft"
          : "border-transparent bg-background/60 backdrop-blur-sm"
      )}
    >
      {/* Reading-progress hairline */}
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary"
      />

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="press shrink-0 rounded-xl transition-transform hover:scale-[1.03]"
          aria-label="Back to top"
        >
          <LogoWordmark size={34} animated />
        </button>

        {/* Desktop section links with a shared sliding indicator */}
        <nav className="hidden items-center gap-0.5 rounded-full border border-border/70 bg-surface/80 p-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-200",
                  active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-full bg-primary shadow-glow"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="press rounded-full ring-offset-2 transition-transform hover:scale-105" aria-label="Account menu">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lifted">
                <DropdownMenuLabel className="truncate text-xs text-muted-foreground">
                  {user.displayName || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("home")} className="rounded-xl font-medium">
                  <UserIcon className="mr-2 h-4 w-4" /> Open dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("settings")} className="rounded-xl font-medium">
                  <Sparkles className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      await logout();
                      toast.success("Signed out");
                      navigate("landing");
                    } catch {
                      toast.error("Could not sign out");
                    }
                  }}
                  className="rounded-xl font-medium text-danger"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onLogin} className="rounded-full px-4 text-xs font-semibold">
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={onGetStarted}
                className="group rounded-full px-5 text-xs font-bold shadow-glow transition-transform hover:scale-[1.04] active:scale-95"
              >
                Get started
                <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="press flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-foreground md:hidden"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={mobileMenuOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } } }}
              className="flex flex-col gap-1 p-4"
            >
              {NAV_ITEMS.map((item) => (
                <motion.button
                  key={item.id}
                  variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                  onClick={() => scrollToSection(item.id)}
                  className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-primary"
                >
                  {item.label}
                </motion.button>
              ))}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="mt-3 flex gap-2"
              >
                <Button variant="outline" onClick={onLogin} className="flex-1 rounded-xl font-semibold">
                  Sign in
                </Button>
                <Button onClick={onGetStarted} className="flex-1 rounded-xl font-bold shadow-glow">
                  Get started
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                */
/* ------------------------------------------------------------------ */

function HeroSection({
  id,
  onGetStarted,
  navigate,
}: {
  id: string;
  onGetStarted: () => void;
  navigate: (s: Screen) => void;
}) {
  return (
    <section id={id} className="relative overflow-hidden scroll-mt-20">
      {/* Ambient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />
        <div className="aurora-blob -left-40 -top-40 h-[520px] w-[520px] bg-primary/15" />
        <div className="aurora-blob aurora-blob-2 right-[-10%] top-[10%] h-[420px] w-[420px] bg-primary/10" />
        <div className="aurora-blob aurora-blob-3 bottom-[-20%] left-1/3 h-[380px] w-[380px] bg-safe/10" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 md:px-6 md:pb-28 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_400px]">
          {/* Copy column */}
          <div className="text-center lg:text-left">
            <Reveal direction="up" distance={16}>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-soft">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                Multi-modal vision AI, grounded in official drug registries
              </span>
            </Reveal>

            <Reveal direction="up" delay={0.08} distance={22}>
              <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.9rem]">
                Point your camera.
                <br />
                <span className="gradient-text">Know your medicine.</span>
              </h1>
            </Reveal>

            <Reveal direction="up" delay={0.16}>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
                Identify any pill, tablet, capsule, or medicine box in seconds — then read a clean
                clinical report cross-checked against{" "}
                <strong className="font-semibold text-foreground">openFDA</strong>,{" "}
                <strong className="font-semibold text-foreground">RxNorm</strong>,{" "}
                <strong className="font-semibold text-foreground">DailyMed</strong>, and regional
                authorities.
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.24}>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={onGetStarted}
                  className="group h-14 rounded-2xl px-8 text-base font-bold shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <ScanLine className="mr-2 h-5 w-5" />
                  Start scanning free
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("paywall")}
                  className="h-14 rounded-2xl border-border px-7 text-base font-semibold hover:bg-surface"
                >
                  Compare plans
                </Button>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.32}>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-safe" /> No credit card required
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" /> Results in seconds
                </span>
                <span className="flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-primary" /> Government-sourced data
                </span>
              </div>
            </Reveal>

            {/* Stat band */}
            <Reveal direction="up" delay={0.4}>
              <dl className="mt-10 grid max-w-lg grid-cols-3 divide-x divide-border rounded-2xl border border-border/70 bg-background/70 py-4 shadow-soft backdrop-blur-sm lg:mx-0">
                <HeroStat value={10} suffix="+" label="Verified registries" />
                <HeroStat value={3} suffix="s" label="Median analysis" />
                <HeroStat value={100} suffix="%" label="Source-attributed" />
              </dl>
            </Reveal>
          </div>

          {/* Device mock */}
          <Reveal direction="left" delay={0.2} distance={32} className="mx-auto w-full max-w-[340px]">
            <HeroDeviceMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ value, suffix, label }: { value: number; suffix?: string; label: string }) {
  return (
    <div className="px-4 text-center lg:text-left">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="font-display text-2xl font-extrabold text-foreground">
          <CountUp value={value} suffix={suffix} />
        </span>
        <span className="mt-0.5 block text-[11px] font-medium leading-snug text-muted-foreground">
          {label}
        </span>
      </dd>
    </div>
  );
}

const MOCK_STAGES = [
  { key: "scan", caption: "Reading imprint and label…" },
  { key: "verify", caption: "Cross-checking registries…" },
  { key: "done", caption: "Verified match found" },
] as const;

/**
 * Animated phone mock that loops the real product flow:
 * capture → registry verification → clinical result card.
 */
function HeroDeviceMock() {
  const reduced = useReducedMotion();
  const [stage, setStage] = React.useState(reduced ? 2 : 0);

  React.useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setStage((s) => (s + 1) % MOCK_STAGES.length), 2600);
    return () => clearInterval(timer);
  }, [reduced]);

  const current = MOCK_STAGES[stage];

  return (
    <div className="relative">
      {/* Glow behind the device */}
      <div aria-hidden className="absolute inset-x-6 -bottom-6 h-24 rounded-full bg-primary/20 blur-3xl" />

      <div className="float-slow relative overflow-hidden rounded-[2.75rem] border-[10px] border-ink bg-background p-4 shadow-2xl">
        {/* Status strip */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Logo size={24} animated />
            <span className="font-display text-xs font-bold">MedSnap AI</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={current.key}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wide",
                stage === 2 ? "bg-safe-soft text-safe" : "bg-primary/10 text-primary"
              )}
            >
              {stage === 2 ? "VERIFIED" : "SCANNING"}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Viewport */}
        <div className="relative mt-4 h-[188px] overflow-hidden rounded-2xl border border-border bg-surface">
          {stage === 0 && !reduced && <span aria-hidden className="scan-sweep z-20" />}

          <AnimatePresence mode="wait">
            {stage === 0 && (
              <motion.div
                key="scan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              >
                {/* Viewfinder corners */}
                <div aria-hidden className="absolute inset-6">
                  {[
                    "left-0 top-0 border-l-2 border-t-2 rounded-tl-lg",
                    "right-0 top-0 border-r-2 border-t-2 rounded-tr-lg",
                    "left-0 bottom-0 border-b-2 border-l-2 rounded-bl-lg",
                    "right-0 bottom-0 border-b-2 border-r-2 rounded-br-lg",
                  ].map((pos) => (
                    <span key={pos} className={cn("absolute h-6 w-6 border-primary/70", pos)} />
                  ))}
                </div>
                <div className="flex h-16 w-16 rotate-[-35deg] items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-background shadow-soft">
                  <span className="h-full w-1/2 bg-primary/15" />
                  <span className="h-full w-1/2 bg-primary/35" />
                </div>
                <span className="font-mono text-[10px] font-bold tracking-widest text-primary">
                  L484 · OVAL · WHITE
                </span>
              </motion.div>
            )}

            {stage === 1 && (
              <motion.ul
                key="verify"
                initial="hidden"
                animate="show"
                exit={{ opacity: 0 }}
                variants={{ show: { transition: { staggerChildren: 0.16 } } }}
                className="absolute inset-0 flex flex-col justify-center gap-2 p-4"
              >
                {["openFDA label match", "RxNorm concept resolved", "DailyMed SPL verified"].map((row, i) => (
                  <motion.li
                    key={row}
                    variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }}
                    className="flex items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2 shadow-soft"
                  >
                    {i === 2 ? (
                      <Throbber size="xs" track={false} />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-safe-soft">
                        <Check className="h-2.5 w-2.5 text-safe" strokeWidth={3.5} />
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-foreground">{row}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}

            {stage === 2 && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex flex-col justify-center gap-3 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Pill className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">Panadol Extra</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      Paracetamol + Caffeine 500/65 mg
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MockField label="CLASS" value="Analgesic" />
                  <MockField label="SOURCE" value="openFDA" accent />
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-xl bg-safe px-3 py-2 text-[11px] font-bold text-safe-foreground shadow-soft">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Identified with high confidence
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Caption + stage pips */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <AnimatePresence mode="wait">
            <motion.p
              key={current.caption}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="truncate text-[10px] font-semibold text-muted-foreground"
            >
              {current.caption}
            </motion.p>
          </AnimatePresence>
          <div className="flex shrink-0 gap-1" aria-hidden>
            {MOCK_STAGES.map((s, i) => (
              <motion.span
                key={s.key}
                animate={{
                  width: i === stage ? 16 : 5,
                  backgroundColor: i === stage ? "var(--primary)" : "var(--border)",
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MockField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2">
      <span className="block text-[9px] font-semibold text-muted-foreground">{label}</span>
      <span className={cn("text-[10px] font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Registry marquee                                                    */
/* ------------------------------------------------------------------ */

const REGISTRIES = [
  { name: "openFDA", sub: "U.S. Food & Drug Administration" },
  { name: "RxNorm", sub: "U.S. National Library of Medicine" },
  { name: "DailyMed", sub: "NIH structured product labels" },
  { name: "PubChem", sub: "NCBI chemical registry" },
  { name: "RxClass", sub: "NIH drug classification" },
  { name: "DRAP", sub: "Drug Regulatory Authority of Pakistan" },
  { name: "NMPA", sub: "National Medical Products Admin, China" },
];

function RegistryMarquee() {
  return (
    <section className="border-y border-border bg-surface py-10">
      <p className="mb-7 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Aggregated live from global and regional medical registries
      </p>
      <div className="mask-fade-x relative overflow-hidden">
        <div className="marquee-track gap-12 pr-12">
          {[...REGISTRIES, ...REGISTRIES].map((r, i) => (
            <div key={`${r.name}-${i}`} className="flex shrink-0 flex-col items-center gap-0.5 px-2">
              <span className="font-display text-lg font-extrabold text-foreground">{r.name}</span>
              <span className="whitespace-nowrap text-[10px] font-medium text-muted-foreground">
                {r.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section heading helper                                              */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left"
      )}
    >
      <Reveal direction="up" distance={14}>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</span>
      </Reveal>
      <Reveal direction="up" delay={0.06} distance={18}>
        <h2 className="mt-2.5 font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal direction="up" delay={0.12}>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base text-pretty">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features — asymmetric bento                                         */
/* ------------------------------------------------------------------ */

function FeaturesSection({ id }: { id: string }) {
  const small = [
    {
      icon: ShieldCheck,
      title: "Official registries only",
      desc: "Every field traces back to openFDA, RxNorm, DailyMed, PubChem, DRAP, or NMPA — never invented.",
    },
    {
      icon: HeartPulse,
      title: "Interaction radar",
      desc: "Checks active ingredients against your saved allergies and current medications on every scan.",
    },
    {
      icon: Database,
      title: "Synced history",
      desc: "Your scan log follows you across devices, with favourites and full-text search.",
    },
    {
      icon: FileText,
      title: "Exportable reports",
      desc: "Share a clean PDF or CSV medication log with a pharmacist or physician.",
    },
  ];

  return (
    <section id={id} className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Capabilities"
          title="Built for accuracy, not guesswork"
          description="MedSnap pairs a multi-modal vision model with verified government data, and falls back to official sources whenever the model is uncertain."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {/* Feature spotlight */}
          <Reveal direction="up" className="lg:col-span-2" distance={26}>
            <article className="sheen group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-border bg-ink p-8 text-primary-foreground shadow-lifted">
              <div aria-hidden className="bg-dots absolute inset-0 opacity-[0.07]" />
              <div aria-hidden className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" />

              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary-foreground backdrop-blur-sm">
                  <Camera className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold">Multi-modal AI vision</h3>
                <p className="mt-2.5 max-w-md text-sm leading-relaxed text-primary-foreground/70">
                  Photograph a loose pill or the whole box. MedSnap reads imprint codes, score marks,
                  colour, shape, and printed label text — then resolves it to a single drug concept.
                </p>
              </div>

              <div className="relative mt-8 flex flex-wrap gap-2">
                {["Imprint OCR", "Shape & colour", "Box label text", "Confidence scoring"].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-primary-foreground/15 bg-primary-foreground/10 px-3 py-1 text-[11px] font-semibold backdrop-blur-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </article>
          </Reveal>

          <Reveal direction="up" delay={0.1} distance={26}>
            <article className="hover-lift flex h-full flex-col justify-between rounded-3xl border border-border bg-surface p-7 shadow-soft">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Languages className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">Plain-language reports</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Uses, dosage, side effects, storage, and interactions — rewritten so a patient can
                  actually read them, in your language.
                </p>
              </div>
              <div className="mt-6 space-y-2">
                {[70, 45, 88].map((w, i) => (
                  <div key={i} className="h-2 rounded-full bg-border" style={{ width: `${w}%` }} />
                ))}
              </div>
            </article>
          </Reveal>

          <RevealGroup className="grid gap-5 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-4" stagger={0.09}>
            {small.map((f) => {
              const Icon = f.icon;
              return (
                <RevealItem key={f.title}>
                  <article className="hover-lift group h-full rounded-3xl border border-border bg-background p-6 shadow-soft hover:border-primary/30">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-bold">{f.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    icon: Camera,
    title: "Capture or search",
    desc: "Photograph the pill or packaging, or just type the medicine name if you already have it.",
  },
  {
    icon: Sparkles,
    title: "AI resolves the match",
    desc: "Vision and OCR output is reconciled against ten-plus registries to pin down one exact product.",
  },
  {
    icon: FileText,
    title: "Read the clinical report",
    desc: "Structured uses, dosage, warnings, and interactions — with a citation for every section.",
  },
];

function HowItWorksSection({ id, onGetStarted }: { id: string; onGetStarted: () => void }) {
  return (
    <section id={id} className="scroll-mt-20 border-y border-border bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <SectionHeading
          eyebrow="The flow"
          title="Three steps, under a minute"
          description="No account gymnastics and no medical jargon — the useful answer comes first."
        />

        <div className="relative mt-16">
          {/* Connector line that draws itself across the steps */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-[12%] right-[12%] top-7 hidden h-0.5 origin-left bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 md:block"
          />

          <RevealGroup className="grid gap-8 md:grid-cols-3" stagger={0.16}>
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <RevealItem key={step.title}>
                  <div className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow ring-8 ring-surface">
                      <Icon className="h-6 w-6" />
                      <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-[10px] font-extrabold text-primary shadow-soft">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-bold">{step.title}</h3>
                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </div>

        <Reveal direction="up" delay={0.2} className="mt-14 flex justify-center">
          <Button
            size="lg"
            onClick={onGetStarted}
            className="group h-13 rounded-full px-8 font-bold shadow-glow transition-transform hover:scale-[1.03] active:scale-95"
          >
            Try your first scan
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

function PricingSection({
  id,
  onGetStarted,
  navigate,
}: {
  id: string;
  onGetStarted: () => void;
  navigate: (s: Screen) => void;
}) {
  const free = [
    "1 AI camera scan per day",
    "Unlimited database name searches",
    "openFDA and RxNorm cross-references",
    "Cloud-synced scan history",
  ];
  const pro = [
    "4 AI camera scans per day",
    "Priority multi-modal processing",
    "PDF and CSV medication log export",
    "Advanced drug interaction radar",
    "Allergy profile monitoring",
  ];

  return (
    <section id={id} className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Pricing"
          title="Start free, upgrade when you scan daily"
          description="Text lookups are always unlimited. You only pay for higher AI camera throughput and clinical exports."
        />

        <div className="mt-14 grid items-start gap-6 md:grid-cols-2">
          <Reveal direction="up" distance={24}>
            <div className="hover-lift flex h-full flex-col rounded-3xl border border-border bg-background p-8 shadow-soft">
              <h3 className="font-display text-xl font-bold">Free</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Essential lookups for everyone.
              </p>
              <p className="mt-6 font-display text-4xl font-extrabold">
                $0
                <span className="ml-1 text-sm font-medium text-muted-foreground">forever</span>
              </p>
              <ul className="mt-7 flex-1 space-y-3">
                {free.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-safe" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                onClick={onGetStarted}
                className="mt-8 h-12 w-full rounded-xl font-bold"
              >
                Create free account
              </Button>
            </div>
          </Reveal>

          <Reveal direction="up" delay={0.12} distance={24}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-primary bg-gradient-to-b from-primary/[0.06] to-background p-8 shadow-glow">
              <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground shadow-soft">
                Most popular
              </span>
              <h3 className="font-display text-xl font-bold text-primary">Pro</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                For daily identification and caregiving.
              </p>
              <p className="mt-6 font-display text-4xl font-extrabold">
                $19.99
                <span className="ml-1 text-sm font-medium text-muted-foreground">/ month</span>
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-primary">
                Roughly 65¢ a day, cancel anytime.
              </p>
              <ul className="mt-7 flex-1 space-y-3">
                {pro.map((f, i) => (
                  <li
                    key={f}
                    className={cn(
                      "flex items-start gap-2.5 text-sm",
                      i === 0 ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => navigate("paywall")}
                className="mt-8 h-12 w-full rounded-xl font-extrabold shadow-glow transition-transform hover:scale-[1.02] active:scale-95"
              >
                Upgrade to Pro
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Testimonials                                                        */
/* ------------------------------------------------------------------ */

const QUOTES = [
  {
    quote:
      "MedSnap identified my prescription in seconds after I lost the package insert. The interaction warnings give me real peace of mind managing my parents' medications.",
    name: "Sarah M.",
    role: "Family caregiver",
  },
  {
    quote:
      "I like that every section cites where it came from. When it is not sure, it says so and shows me the official label instead of inventing an answer.",
    name: "Daniyal R.",
    role: "Community pharmacist",
  },
  {
    quote:
      "The exported PDF log is what finally made my appointments productive. I hand it over and we skip ten minutes of guessing.",
    name: "Elena K.",
    role: "Patient, chronic care",
  },
];

function TestimonialsSection() {
  return (
    <section className="border-y border-border bg-surface py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading eyebrow="Reception" title="Trusted by patients and caregivers" />

        <RevealGroup className="mt-12 grid gap-5 md:grid-cols-3" stagger={0.1}>
          {QUOTES.map((q) => (
            <RevealItem key={q.name}>
              <figure className="hover-lift flex h-full flex-col rounded-3xl border border-border bg-background p-7 shadow-soft">
                <Quote className="h-7 w-7 text-primary/25" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground text-pretty">
                  {q.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {q.name[0]}
                  </span>
                  <span>
                    <span className="block text-xs font-bold">{q.name}</span>
                    <span className="block text-[11px] text-muted-foreground">{q.role}</span>
                  </span>
                  <span className="ml-auto flex gap-0.5" aria-label="Five out of five">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-warn text-warn" />
                    ))}
                  </span>
                </figcaption>
              </figure>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* FAQ — animated accordion                                            */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: "How do I identify a pill by taking a picture?",
    a: "Open MedSnap, tap Start scanning, and take a clear photo of the pill, capsule, or the prescription box label. MedSnap reads imprinted numbers and letters, colour, shape, and printed label text, then resolves it to a single drug product in seconds.",
  },
  {
    q: "Which official medical databases does MedSnap search?",
    a: "MedSnap cross-references live data from U.S. openFDA, NIH RxNorm and RxClass, NIH DailyMed, PubChem, DRAP (Drug Regulatory Authority of Pakistan), and NMPA (National Medical Products Administration, China).",
  },
  {
    q: "Can MedSnap check for drug interactions and allergies?",
    a: "Yes. Once you add your allergies and current medications to your profile, MedSnap flags ingredient overlaps, double-dosing risk, and known interaction pairs on every scan, and shows a side-by-side comparison matrix.",
  },
  {
    q: "Is MedSnap free to use?",
    a: "Yes. Free accounts get a daily AI camera scan plus unlimited text database searches across every registry, with no credit card required. Pro raises the daily camera limit and adds clinical exports.",
  },
  {
    q: "What pill shapes, colours, and imprint codes are recognised?",
    a: "All standard pharmaceutical forms — round, oval, oblong, capsule, and caplet — along with imprint codes such as L484, IP115, or M367, score marks, and multi-coloured capsule combinations.",
  },
  {
    q: "Is this a substitute for medical advice?",
    a: "No. MedSnap is an educational identification and reference tool. Always confirm any medication decision with a pharmacist or physician before acting on it.",
  },
];

function FAQSection({ id }: { id: string }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <section id={id} className="scroll-mt-20 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="Pill identification, data sources, and what MedSnap will and will not do."
        />

        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={faq.q} direction="up" delay={i * 0.04} distance={16}>
                <div
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-background transition-colors duration-300",
                    isOpen ? "border-primary/40 shadow-lifted" : "border-border shadow-soft"
                  )}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold sm:text-base">{faq.q}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
                        isOpen ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
                      )}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* About + CTA + Footer                                                */
/* ------------------------------------------------------------------ */

function AboutSection({ id }: { id: string }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-border bg-surface py-20 md:py-24">
      <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 md:grid-cols-2 md:px-6">
        <SectionHeading
          align="left"
          eyebrow="Our mission"
          title="Reliable medicine information, everywhere"
          description="MedSnap combines multi-modal vision models with more than ten verified government and health-authority drug registries. The goal is simple: make trustworthy medication identification available to anyone with a camera, not just people with a pharmacy nearby."
        />

        <RevealGroup className="grid grid-cols-2 gap-4" stagger={0.09}>
          {[
            { icon: Database, k: "10+", v: "Official registries" },
            { icon: Languages, k: "6", v: "Report languages" },
            { icon: ShieldCheck, k: "0", v: "Invented data fields" },
            { icon: Zap, k: "3s", v: "Median analysis" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <RevealItem key={s.v}>
                <div className="hover-lift rounded-2xl border border-border bg-background p-5 shadow-soft">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-display text-2xl font-extrabold">{s.k}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{s.v}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="px-4 py-20 md:px-6 md:py-28">
      <Reveal direction="up" distance={28} className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink p-10 text-center text-primary-foreground shadow-lifted md:p-16">
          <div aria-hidden className="bg-grid absolute inset-0 opacity-[0.08]" />
          <div aria-hidden className="aurora-blob left-1/4 top-[-40%] h-[300px] w-[300px] bg-primary/40" />
          <div aria-hidden className="aurora-blob aurora-blob-2 right-[10%] bottom-[-50%] h-[260px] w-[260px] bg-primary/25" />

          <div className="relative">
            <Logo size={56} animated showPulse className="mx-auto" />
            <h2 className="mt-6 font-display text-3xl font-extrabold text-balance sm:text-4xl">
              Ready to identify your medication?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/70 sm:text-base">
              Create a free account and run your first verified scan in under a minute.
            </p>
            <Button
              size="lg"
              onClick={onGetStarted}
              className="group mt-8 h-14 rounded-full bg-background px-8 text-base font-extrabold text-primary shadow-lifted transition-transform hover:scale-[1.03] hover:bg-background active:scale-95"
            >
              Get started free
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <p className="mt-4 text-[11px] font-medium text-primary-foreground/50">
              Educational tool — always confirm with a healthcare professional.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function FooterSection({
  navigate,
  onLogin,
  onGetStarted,
  scrollToSection,
}: {
  navigate: (s: Screen) => void;
  onLogin: () => void;
  onGetStarted: () => void;
  scrollToSection: (id: string) => void;
}) {
  return (
    <footer className="border-t border-border bg-background py-14">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <LogoWordmark size={32} animated={false} />
            <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted-foreground">
              MedSnap AI is an educational medicine identification tool. It does not diagnose,
              prescribe, or replace professional medical advice.
            </p>
          </div>

          <FooterColumn
            title="Product"
            links={[
              { label: "Features", onClick: () => scrollToSection("features") },
              { label: "How it works", onClick: () => scrollToSection("how-it-works") },
              { label: "Pricing", onClick: () => scrollToSection("pricing") },
              { label: "FAQ", onClick: () => scrollToSection("faq") },
            ]}
          />
          <FooterColumn
            title="Legal & access"
            links={[
              { label: "Medical disclaimer", onClick: () => navigate("legal-disclaimer") },
              { label: "Terms of service", onClick: () => navigate("legal-terms") },
              { label: "Privacy policy", onClick: () => navigate("legal-privacy") },
              { label: "Sign in", onClick: onLogin },
              { label: "Get started", onClick: onGetStarted, emphasis: true },
            ]}
          />
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} MedSnap AI. Data sourced from openFDA, RxNorm, DailyMed,
            PubChem, DRAP, and NMPA.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; onClick: () => void; emphasis?: boolean }[];
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">{title}</p>
      <ul className="mt-4 flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <button
              onClick={l.onClick}
              className={cn(
                "link-underline text-xs font-medium transition-colors",
                l.emphasis ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

/** Tracks which section is currently dominant in the viewport. */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = React.useState<string>(ids[0] ?? "");

  React.useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/** True once the window has scrolled past `threshold` pixels. */
function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}
