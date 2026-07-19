"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Globe,
  Database,
  Check,
  Star,
  ChevronRight,
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

export function LandingScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [transitioning, setTransitioning] = React.useState(false);
  const [transitionMessage, setTransitionMessage] = React.useState("Loading MedSnap…");

  const transitionTo = (target: Screen, message = "Loading MedSnap…") => {
    setTransitioning(true);
    setTransitionMessage(message);
    setTimeout(() => {
      navigate(target);
    }, 1000);
  };

  const handleGetStarted = () => {
    if (user) {
      transitionTo("home", "Opening dashboard…");
    } else {
      transitionTo("auth", "Loading sign up…");
    }
  };

  const handleLogin = () => {
    if (user) {
      transitionTo("home", "Opening dashboard…");
    } else {
      transitionTo("auth", "Loading sign in…");
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (transitioning) {
    return <BrandedLoader message={transitionMessage} />;
  }

  return (
    <div className="relative min-h-[100dvh] bg-slate-50/50 text-slate-900 selection:bg-primary/20">
      {/* === NAV === */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-white/80 backdrop-blur-xl transition-all shadow-soft">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="transition-transform hover:scale-105 active:scale-95">
            <LogoWordmark size={34} animated />
          </button>

          <div className="hidden items-center gap-1 rounded-full border border-border/50 bg-muted/40 p-1 md:flex">
            {[
              { id: "hero", label: "Home" },
              { id: "features", label: "Features" },
              { id: "how-it-works", label: "How It Works" },
              { id: "pricing", label: "Pricing" },
              { id: "faq", label: "FAQ" },
              { id: "about", label: "About" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="rounded-full px-4 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform hover:scale-105">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                        {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lifted">
                  <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.displayName || user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("home")} className="rounded-xl font-medium">
                    <UserIcon className="mr-2 h-4 w-4" /> Open App Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("settings")} className="rounded-xl font-medium">
                    <Sparkles className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { try { await logout(); toast.success("Signed out"); navigate("landing"); } catch { toast.error("Could not sign out"); } }} className="rounded-xl text-danger font-medium">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleLogin} className="rounded-full px-4 font-semibold text-xs">
                  Sign in
                </Button>
                <Button size="sm" onClick={handleGetStarted} className="rounded-full px-5 text-xs font-bold shadow-glow hover:scale-105 transition-transform">
                  Get started <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border md:hidden"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-white md:hidden"
            >
              <div className="flex flex-col gap-1 p-4">
                {[
                  { id: "hero", label: "Home" },
                  { id: "features", label: "Features" },
                  { id: "how-it-works", label: "How It Works" },
                  { id: "pricing", label: "Pricing" },
                  { id: "faq", label: "FAQ" },
                  { id: "about", label: "About" },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-muted-foreground hover:text-primary"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={handleLogin} className="flex-1 rounded-xl font-semibold">Sign in</Button>
                  <Button onClick={handleGetStarted} className="flex-1 rounded-xl font-bold shadow-soft">Get started</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* === FULL CONTINUOUS LANDING PAGE CONTENT === */}
      <div className="w-full">
        {/* HERO SECTION */}
        <div id="hero">
          <HeroSection onGetStarted={handleGetStarted} onLogin={handleLogin} navigate={navigate} />
        </div>

        {/* TRUST BAR SECTION */}
        <TrustBarSection />

        {/* FEATURES SECTION */}
        <div id="features">
          <FeaturesSection />
        </div>

        {/* UX PSYCHOLOGY DESIGN SECTION */}
        <UXPsychologySection />

        {/* HOW IT WORKS SECTION */}
        <div id="how-it-works">
          <HowItWorksSection onGetStarted={handleGetStarted} />
        </div>

        {/* PRICING SECTION */}
        <div id="pricing">
          <PricingSection onGetStarted={handleGetStarted} navigate={navigate} />
        </div>

        {/* FAQ SECTION (FOR GOOGLE RICH SNIPPETS) */}
        <div id="faq">
          <FAQSection />
        </div>

        {/* TESTIMONIALS SECTION */}
        <TestimonialsSection />

        {/* ABOUT SECTION */}
        <div id="about">
          <AboutSection onGetStarted={handleGetStarted} />
        </div>

        {/* FINAL CTA BANNER */}
        <CTASection onGetStarted={handleGetStarted} />
      </div>

      {/* FOOTER */}
      <FooterSection navigate={navigate} handleLogin={handleLogin} handleGetStarted={handleGetStarted} />
    </div>
  );
}

function HeroSection({
  onGetStarted,
  navigate,
}: {
  onGetStarted: () => void;
  onLogin: () => void;
  navigate: (s: Screen) => void;
}) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -right-32 top-1/4 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_420px] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary shadow-soft mb-6">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              AI Multi-Modal Vision & Global Medical Databases
            </div>

            <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.08]">
              Point your camera.
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Know your medicine.
              </span>
            </h1>

            <p className="mt-5 text-base text-slate-600 sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Identify any pill, tablet, capsule, or medicine box in seconds.
              Get instant, 100% typo-free clinical reports powered by <strong>openFDA</strong>, <strong>RxNorm</strong>, <strong>DRAP Pakistan</strong>, and <strong>NMPA China</strong>.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="h-14 rounded-2xl px-8 text-base font-bold shadow-glow hover:scale-[1.02] active:scale-95 transition-all"
              >
                Start Scanning Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("paywall")}
                className="h-14 rounded-2xl px-7 text-base font-semibold border-border/80 hover:bg-white"
              >
                View Plans
              </Button>
            </div>

            <div className="mt-6 flex items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-safe" /> Instant Account Access</span>
              <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Under 3s AI Analysis</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mx-auto w-full max-w-[340px]"
          >
            <div className="relative rounded-[2.5rem] border-[10px] border-slate-900 bg-white shadow-2xl p-4 overflow-hidden">
              <motion.div
                className="absolute left-0 right-0 z-20 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_#2563eb]"
                animate={{ top: ["15%", "85%", "15%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Logo size={24} animated />
                  <span className="font-display text-xs font-bold">MedSnap AI</span>
                </div>
                <span className="rounded-full bg-safe-soft px-2 py-0.5 text-[9px] font-bold text-safe">VERIFIED</span>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    <Pill className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Panadol Extra</p>
                    <p className="text-[11px] text-slate-500">Paracetamol + Caffeine 500/65mg</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-white p-2 border border-slate-100">
                    <span className="text-slate-400 block font-semibold">CLASS</span>
                    <span className="font-bold text-slate-700">Analgesic</span>
                  </div>
                  <div className="rounded-lg bg-white p-2 border border-slate-100">
                    <span className="text-slate-400 block font-semibold">REGISTRY</span>
                    <span className="font-bold text-primary">DRAP / FDA</span>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-primary text-white p-2.5 text-center text-xs font-bold shadow-soft">
                  ✓ 100% Match Identified
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrustBarSection() {
  return (
    <section className="border-y border-border/50 bg-white py-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-6">
          Aggregated Live Data From Global & Regional Medical Registries
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 text-slate-700">
          <div className="text-center"><p className="font-display text-lg font-extrabold">openFDA</p><p className="text-[10px] text-muted-foreground">US Food & Drug Admin</p></div>
          <div className="text-center"><p className="font-display text-lg font-extrabold">🇵🇰 DRAP</p><p className="text-[10px] text-muted-foreground">Pakistan Authority</p></div>
          <div className="text-center"><p className="font-display text-lg font-extrabold">🇨🇳 NMPA</p><p className="text-[10px] text-muted-foreground">China Administration</p></div>
          <div className="text-center"><p className="font-display text-lg font-extrabold">RxNorm</p><p className="text-[10px] text-muted-foreground">NIH Drug Database</p></div>
          <div className="text-center"><p className="font-display text-lg font-extrabold">PubChem</p><p className="text-[10px] text-muted-foreground">NCBI Chemical Registry</p></div>
        </div>
      </div>
    </section>
  );
}

function UXPsychologySection() {
  const principles = [
    {
      badge: "Principle 1",
      title: "Smart Defaults",
      desc: "Pre-fills forms with sensible choices (Tablet, 500mg) and shows immediate count preview ('10,000+ ready') to eliminate decision fatigue.",
      icon: Sparkles,
      color: "from-blue-500/10 to-indigo-500/10 text-primary border-blue-200"
    },
    {
      badge: "Principle 2",
      title: "Goal Gradient Effect",
      desc: "Never starts users at 0%. Progress meters initialize at 25% with Step 1 ('Profile Initialized ✓') pre-completed for momentum.",
      icon: Check,
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200"
    },
    {
      badge: "Principle 3",
      title: "Reciprocity (Value First)",
      desc: "Delivers full verified clinical report summaries and active ingredient breakdowns first before asking users to save or create an account.",
      icon: ShieldCheck,
      color: "from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-200"
    },
    {
      badge: "Principle 4",
      title: "IKEA & Endowment Effect",
      desc: "Co-creation of medical profile, custom dosage instructions, and allergy cabinet makes users feel genuine ownership over their data.",
      icon: HeartPulse,
      color: "from-rose-500/10 to-pink-500/10 text-rose-600 border-rose-200"
    },
    {
      badge: "Principle 5",
      title: "Loss Aversion",
      desc: "Reframes upgrade CTAs around protecting active allergy radars & saved family records with secondary 'I'll risk it' options.",
      icon: Zap,
      color: "from-amber-500/10 to-yellow-500/10 text-amber-600 border-amber-200"
    },
    {
      badge: "Principle 6",
      title: "Contrast Price Anchoring",
      desc: "Reframes Pro subscription cost relative to ER visits ('Less than 65¢/day vs $150+ ER visit') so value is instantly clear.",
      icon: Star,
      color: "from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-200"
    }
  ];

  return (
    <section className="py-20 bg-white border-y border-border/50">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Design Architecture
          </span>
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl text-slate-900">
            Engineered Around Core UX Psychology
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            MedSnap is built on 6 fundamental behavioral psychology principles to ensure zero decision fatigue, effortless onboarding, and immediate patient clarity.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-3xl border p-6 bg-gradient-to-br transition-all hover:shadow-lifted hover:scale-[1.01]",
                  p.color
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider shadow-soft">
                    {p.badge}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/90 shadow-soft">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900">{p.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed font-medium">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const list = [
    { icon: Camera, title: "Multi-Modal AI Vision", desc: "Snap a photo of pills, capsules, or box packaging for instantaneous identification." },
    { icon: ShieldCheck, title: "Global Registries", desc: "Cross-checked across US openFDA, Pakistani DRAP, Chinese NMPA, and NIH PubChem." },
    { icon: HeartPulse, title: "Interaction Radar", desc: "Proactively checks active drug components against allergy profiles." },
    { icon: Database, title: "Cloud History", desc: "Synchronizes your scan history safely across all authorized devices." },
  ];

  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Key Capabilities</span>
          <h2 className="font-display text-3xl font-bold mt-2">Comprehensive Medical Intelligence</h2>
          <p className="mt-2 text-slate-600">Built for accuracy, clarity, and patient safety.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="rounded-2xl border border-border/70 bg-white p-6 shadow-soft hover:shadow-lifted hover:border-primary/30 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-base">{f.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="border-y border-border/50 bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Simple & Fast</span>
        <h2 className="font-display text-3xl font-bold mt-2">How MedSnap Works</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-lg mx-auto">Identify and understand any prescription or over-the-counter medicine in 3 quick steps.</p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-slate-50/50 p-6 shadow-soft text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold mb-4">1</div>
            <p className="font-bold text-base">Upload or Search</p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Take a photo of the pill label or box, or type in the medicine name.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-slate-50/50 p-6 shadow-soft text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold mb-4">2</div>
            <p className="font-bold text-base">AI Synthesis</p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Multi-modal AI cross-checks 10+ registries to eliminate typos and match specs.</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-slate-50/50 p-6 shadow-soft text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white font-extrabold mb-4">3</div>
            <p className="font-bold text-base">Clinical Report</p>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">Get 100% clean, structured drug summaries, dosage, warnings, and PDF exports.</p>
          </div>
        </div>

        <Button size="lg" onClick={onGetStarted} className="mt-10 rounded-full font-bold px-8 shadow-glow">
          Start Scanning Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function PricingSection({ onGetStarted, navigate }: { onGetStarted: () => void; navigate: (s: Screen) => void }) {
  return (
    <section className="py-20 bg-slate-50/50">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Affordable Access</span>
        <h2 className="font-display text-3xl font-bold mt-2">Transparent Plans</h2>
        <p className="mt-2 text-slate-600 text-sm">Choose the right plan for your personal or caregiving medication tracking needs.</p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border/80 p-8 bg-white shadow-soft text-left flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl">Standard Free</h3>
              <p className="text-4xl font-extrabold mt-4">$0 <span className="text-xs text-slate-500 font-normal">/ forever</span></p>
              <p className="mt-2 text-xs text-slate-500">Essential medication lookups for everyone.</p>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-safe" /> 1 Free AI Camera Scan / day</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-safe" /> Unlimited Database Searches</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-safe" /> openFDA & RxNorm Cross-References</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-safe" /> Cloud Account Synchronization</li>
              </ul>
            </div>
            <Button variant="outline" onClick={onGetStarted} className="mt-8 w-full rounded-xl font-bold h-11">Sign Up Free</Button>
          </div>

          <div className="rounded-3xl border-2 border-primary p-8 bg-gradient-to-b from-primary/5 to-white shadow-glow text-left flex flex-col justify-between relative">
            <div className="absolute -top-3.5 right-6 rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold text-white tracking-wide uppercase shadow-soft">Most Popular</div>
            <div>
              <h3 className="font-bold text-xl text-primary">Pro Member</h3>
              <p className="text-4xl font-extrabold mt-4">$19.99 <span className="text-xs text-slate-500 font-normal">/ month</span></p>
              <p className="mt-2 text-xs text-slate-500">For daily medication identification & full history exports.</p>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-semibold text-slate-900"><Check className="h-4 w-4 text-primary" /> 4 AI Camera Scans / day</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Priority Multi-Modal Processing Speed</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Clinical PDF & CSV Medical Log Export</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advanced Drug-Drug Interaction Radar</li>
              </ul>
            </div>
            <Button onClick={() => navigate("paywall")} className="mt-8 w-full rounded-xl font-extrabold h-11 shadow-glow">Upgrade to Pro</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      q: "How do I identify a pill by taking a picture?",
      a: "Simply open MedSnap AI on your mobile or web browser, click 'Start Scanning Now', and take a clear picture of the pill, tablet, capsule, or prescription box label. MedSnap AI automatically reads imprinted numbers/letters, color, shape, and label text to identify the drug in seconds."
    },
    {
      q: "Which official medical databases does MedSnap AI search?",
      a: "MedSnap cross-references live data directly from US openFDA, NIH RxNorm, NIH DailyMed, PubChem, DRAP (Drug Regulatory Authority of Pakistan), and NMPA (National Medical Products Administration China)."
    },
    {
      q: "Can MedSnap check for drug interactions and user allergies?",
      a: "Yes. MedSnap features an active Interaction Radar and Side-by-Side Comparison Matrix. Once you enter your allergies or active medications into your profile, MedSnap proactively flags ingredient overlaps, double-dosing risks, and adverse reaction warnings."
    },
    {
      q: "Is MedSnap free to use for pill lookups?",
      a: "Yes! MedSnap provides free camera scans every day and unlimited text database searches across all global registries without requiring a credit card."
    },
    {
      q: "What pill shapes, colors, and imprint codes can MedSnap recognize?",
      a: "MedSnap recognizes all standard pharmaceutical pill forms—round, oval, oblong, capsule, caplet—along with imprint codes (such as L484, IP115, M367), score marks, and multi-colored capsule combinations."
    }
  ];

  return (
    <section className="py-20 bg-white border-y border-border/50">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Frequently Asked Questions</span>
          <h2 className="font-display text-3xl font-bold mt-2">Everything You Need to Know</h2>
          <p className="mt-2 text-slate-600 text-sm">Find answers about pill identification, safety checks, and official registry sources.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group rounded-2xl border border-border/70 bg-slate-50/50 p-5 shadow-soft transition-all text-left [&[open]]:bg-white [&[open]]:border-primary/40 [&[open]]:shadow-lifted">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-sm sm:text-base text-slate-900 list-none">
                <span>{faq.q}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90 group-open:text-primary shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 border-b border-border/50 bg-white">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <div className="flex justify-center gap-1 text-amber-400 mb-3">
          <Star className="h-5 w-5 fill-amber-400" />
          <Star className="h-5 w-5 fill-amber-400" />
          <Star className="h-5 w-5 fill-amber-400" />
          <Star className="h-5 w-5 fill-amber-400" />
          <Star className="h-5 w-5 fill-amber-400" />
        </div>
        <h2 className="font-display text-3xl font-bold">Trusted by Caregivers & Patients</h2>
        <p className="mt-6 text-base text-slate-700 max-w-xl mx-auto leading-relaxed italic">
          "MedSnap identified my prescription pill in seconds when I lost the package insert. The allergy and drug interaction warning system gives me total peace of mind for my parents' medications."
        </p>
        <p className="mt-4 text-xs font-bold text-slate-900">— Sarah M., Family Caregiver</p>
      </div>
    </section>
  );
}

function AboutSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 text-center bg-slate-50/50">
      <div className="mx-auto max-w-2xl px-4">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">Our Mission</span>
        <h2 className="font-display text-3xl font-bold mt-2">About MedSnap AI</h2>
        <p className="mt-4 text-slate-600 text-sm leading-relaxed">
          MedSnap combines cutting-edge multi-modal vision models with 10+ verified government and health authority drug registries (US openFDA, Pakistani DRAP, Chinese NMPA, NIH PubChem). Our mission is to democratize instant, reliable medication identification for safer healthcare globally.
        </p>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-indigo-600 to-blue-600 p-10 md:p-16 text-center text-white shadow-glow">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Ready to identify your medication?</h2>
          <p className="mt-3 text-base text-white/80 max-w-md mx-auto">Create a free account in seconds and access verified medical analysis immediately.</p>
          <Button size="lg" onClick={onGetStarted} className="mt-8 h-14 rounded-full bg-white px-8 text-base font-extrabold text-primary hover:bg-slate-50 shadow-lifted">
            Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function FooterSection({ navigate, handleLogin, handleGetStarted }: {
  navigate: (s: Screen) => void; handleLogin: () => void; handleGetStarted: () => void;
}) {
  return (
    <footer className="border-t border-border/60 bg-white py-12 text-xs text-slate-500">
      <div className="mx-auto max-w-6xl px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <LogoWordmark size={30} animated={false} />
          <p>© 2026 MedSnap AI. Educational medical tool — consult healthcare professionals for prescriptions.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-600">
          <button onClick={() => navigate("legal-disclaimer")} className="hover:text-primary">Disclaimer</button>
          <button onClick={() => navigate("legal-terms")} className="hover:text-primary">Terms</button>
          <button onClick={() => navigate("legal-privacy")} className="hover:text-primary">Privacy Policy</button>
          <button onClick={handleLogin} className="hover:text-primary">Sign In</button>
          <button onClick={handleGetStarted} className="text-primary font-bold hover:underline">Get Started</button>
        </div>
      </div>
    </footer>
  );
}

function BrandedLoader({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white">
      <Logo size={72} animated showPulse />
      <p className="mt-6 font-display text-xl font-bold">Med<span className="text-primary">Snap</span></p>
      <div className="throbber throbber-lg mt-6" />
      <p className="mt-4 text-xs font-semibold text-muted-foreground">{message}</p>
    </div>
  );
}
