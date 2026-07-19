"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  X, Check, Camera, History, ShieldAlert, Bell, Sparkles, Share2,
  Loader2, Crown, CreditCard, Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "sonner";

const PLANS = [
  {
    id: "monthly" as const,
    label: "Monthly",
    price: "$19.99",
    per: "/mo",
    note: "Billed monthly. Cancel anytime.",
    highlight: false,
  },
  {
    id: "yearly" as const,
    label: "Yearly",
    price: "$99.99",
    per: "/yr",
    note: "$8.33/mo equivalent. Save 58%.",
    highlight: true,
  },
];

const PRO_FEATURES = [
  { icon: Camera, title: "4 scans per day", desc: "Free tier includes 1 scan/day — Pro gives you 4 scans/day." },
  { icon: History, title: "Cloud sync + export", desc: "Export scan logs as PDF or CSV for caregiver handoffs." },
  { icon: Bell, title: "Interaction alerts", desc: "Proactive alerts when a new scan interacts with one on file." },
  { icon: ShieldAlert, title: "Allergy warnings on every scan", desc: "Cross-checks against your personal allergy list." },
  { icon: Sparkles, title: "Priority AI processing", desc: "Faster AI responses with priority queue." },
  { icon: Share2, title: "Share results with a doctor", desc: "Generate a clean, doctor-friendly summary link." },
];

export function PaywallScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const activatePro = useAppStore((s) => s.activatePro);
  const isPro = useAppStore((s) => s.isPro);
  const { user } = useAuth();
  const [selected, setSelected] = React.useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState(false);
  const [stripeAvailable, setStripeAvailable] = React.useState<boolean | null>(null);

  // Check if Stripe is configured
  React.useEffect(() => {
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "monthly", email: "test@test.com" }),
    }).then(r => r.json()).then(data => {
      setStripeAvailable(!data.demoMode);
    }).catch(() => setStripeAvailable(false));
  }, []);

  // If already Pro, show success state
  if (isPro) {
    return (
      <div className="relative flex min-h-[100dvh] flex-col bg-background">
        <button
          onClick={() => navigate("home")}
          aria-label="Close"
          className="absolute right-4 top-4 z-20 rounded-full bg-card/80 p-2 text-muted-foreground shadow-soft backdrop-blur hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 pb-8 pt-12">
          <motion.div
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/85 shadow-glow"
          >
            <Crown className="h-10 w-10 text-white" />
          </motion.div>
          <h1 className="mt-5 text-center text-[28px] font-bold leading-tight">
            You're a MedSnap Pro member!
          </h1>
          <p className="mt-2 text-center text-base text-muted-foreground">
            All Pro features are unlocked. Enjoy unlimited scans, cloud sync, and more.
          </p>
          <Button onClick={() => navigate("home")} className="mt-8 h-14 w-full rounded-2xl text-base font-semibold">
            Start scanning
          </Button>
        </div>
      </div>
    );
  }

  // Subscribe — go to checkout page (or auth if not signed in)
  async function handleSubscribe() {
    if (!user) {
      navigate("auth");
      return;
    }
    navigate("checkout");
  }

  // Demo mode — activate Pro without payment (for testing)
  async function handleDemoActivate() {
    setDemoLoading(true);
    try {
      activatePro(selected);
      toast.success("Pro activated! (Demo Mode)");
      setTimeout(() => navigate("home"), 1000);
    } catch {
      activatePro(selected);
      toast.success("Pro activated locally! (Demo Mode)");
      setTimeout(() => navigate("home"), 1000);
    } finally {
      setDemoLoading(false);
    }
  }

  function choose(action: "subscribe" | "demo" | "skip") {
    if (action === "subscribe") {
      handleSubscribe();
    } else if (action === "demo") {
      handleDemoActivate();
    } else {
      completeOnboarding();
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-muted/60 via-muted/20 to-transparent"
      />
      <button
        onClick={() => navigate("home")}
        aria-label="Close"
        className="absolute right-4 top-4 z-20 rounded-full bg-card/80 p-2 text-muted-foreground shadow-soft backdrop-blur hover:text-foreground"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-12">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/85 shadow-glow"
        >
          <Sparkles className="h-10 w-10 text-white" strokeWidth={2} />
        </motion.div>

        <h1 className="mt-5 text-center text-[28px] font-bold leading-tight text-balance">
          Protect Your Health with MedSnap Pro
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground text-balance">
          Less than <strong className="text-primary">65¢ a day</strong> — compared to <span className="line-through text-slate-400">$150+</span> for a single emergency room visit or prescription error.
        </p>

        {/* Loss Aversion Protection Card */}
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 flex items-start gap-2.5 text-xs text-rose-800 shadow-soft">
          <ShieldAlert className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            <strong>Don't risk missing active drug-drug interaction warnings:</strong> Unlocking Pro protects all family scan records and guarantees 4 AI scans daily.
          </p>
        </div>

        {/* Pro features */}
        <div className="mt-7 space-y-3">
          {PRO_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.04, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold leading-tight">{f.title}</p>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
                <Check className="mt-1 h-4 w-4 text-safe" />
              </motion.div>
            );
          })}
        </div>

        {/* Plan selector */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          {PLANS.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  "relative rounded-2xl border-2 p-4 text-left transition-all",
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-2 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Best value
                  </span>
                )}
                <p className="text-sm font-medium text-muted-foreground">{p.label}</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{p.price}</span>
                  <span className="text-xs text-muted-foreground">{p.per}</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {p.note}
                </p>
                <div
                  className={cn(
                    "mt-2 flex h-5 w-5 items-center justify-center rounded-full border-2",
                    active ? "border-primary bg-primary text-white" : "border-muted-foreground/30"
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="mt-auto space-y-3 pt-7">
          {/* Subscribe button — goes to checkout page */}
          <Button
            onClick={() => choose("subscribe")}
            disabled={loading}
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold shadow-glow"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
            {user ? "Upgrade to Pro" : "Sign in to upgrade"}
          </Button>

          {/* Reframed Skip with Loss Aversion */}
          <button
            onClick={() => choose("skip")}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
          >
            I'll risk it with the basic 1 scan/day plan →
          </button>

          <p className="text-center text-[11px] leading-snug text-muted-foreground">
            Subscriptions auto-renew unless cancelled. Manage in Settings.
            MedSnap is not a substitute for professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
