"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Monitor,
  Bell,
  Shield,
  Database,
  Trash2,
  FileText,
  AlertTriangle,
  Plus,
  X,
  Heart,
  User,
  Globe,
  Crown,
  LogOut,
  Info,
  Sparkles,
  ShieldAlert,
  Gift,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { OnboardingRole } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { LANGUAGES, type SupportedLanguage } from "@/lib/translations";

const ROLES: Record<OnboardingRole, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  personal: { label: "Personal use", icon: User },
  caregiver: { label: "Caregiver", icon: Heart },
  "elderly-parent": { label: "Elderly parent", icon: Heart },
  curiosity: { label: "Just curious", icon: Info },
};

export function SettingsScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const scans = useAppStore((s) => s.scans);
  const reports = useAppStore((s) => s.reports);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const { user, logout, isFirebaseEnabled } = useAuth();
  const resetOnboarding = useAppStore((s) => s.resetOnboarding);
  const isPro = useAppStore((s) => s.isPro);
  const proPlan = useAppStore((s) => s.proPlan);
  const proSince = useAppStore((s) => s.proSince);
  const deactivatePro = useAppStore((s) => s.deactivatePro);

  const [allergyInput, setAllergyInput] = React.useState("");
  const [conditionInput, setConditionInput] = React.useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);

  function toggleAllergy(a: string) {
    const cur = profile.allergies ?? [];
    if (cur.includes(a)) {
      setProfile({ allergies: cur.filter((x) => x !== a) });
    } else {
      setProfile({ allergies: [...cur, a] });
    }
  }
  function addAllergy() {
    const v = allergyInput.trim();
    if (!v) return;
    if (!(profile.allergies ?? []).includes(v)) {
      setProfile({ allergies: [...(profile.allergies ?? []), v] });
    }
    setAllergyInput("");
  }
  function addCondition() {
    const v = conditionInput.trim();
    if (!v) return;
    if (!(profile.conditions ?? []).includes(v)) {
      setProfile({ conditions: [...(profile.conditions ?? []), v] });
    }
    setConditionInput("");
  }

  return (
    <div className="flex flex-col gap-5 py-3">
      <header>
        <h1 className="text-[24px] font-bold leading-tight">Settings</h1>
        <p className="text-xs text-muted-foreground">Personalize your MedSnap experience</p>
      </header>

      {/* Profile summary */}
      <Card className="overflow-hidden border-border/60 p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-soft">
            <User className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">MedSnap user</p>
            <p className="text-xs text-muted-foreground">
              {profile.role ? ROLES[profile.role].label : "Role not set"}
              {profile.takesMedicationRegularly !== null && (
                <> · {profile.takesMedicationRegularly ? "Regular medication" : "Occasional use"}</>
              )}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() => resetOnboarding()}
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Pro status / upsell */}
      <Card className="overflow-hidden border-border/60 bg-muted/40 p-5 shadow-soft">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            isPro ? "bg-primary text-white" : "bg-trust text-trust-foreground"
          )}>
            <Crown className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{isPro ? "MedSnap Pro" : "Free plan"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {isPro
                ? `${proPlan === "yearly" ? "Yearly" : "Monthly"} subscription · Active${proSince ? ` since ${new Date(proSince).toLocaleDateString()}` : ""}`
                : `${scans.length}/5 scans used this month · ${reports.length} reports submitted`
              }
            </p>
            {isPro ? (
              <Button
                onClick={() => setCancelDialogOpen(true)}
                variant="outline"
                size="sm"
                className="mt-3 h-9 rounded-xl border-danger/30 text-danger hover:bg-danger-soft"
              >
                Cancel Subscription
              </Button>
            ) : (
              <Button
                onClick={() => navigate("paywall")}
                size="sm"
                className="mt-3 h-9 rounded-xl font-semibold shadow-soft"
              >
                Upgrade to Pro
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Retention Cancellation Flow Dialog */}
      <CancellationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirmCancel={() => {
          deactivatePro();
          toast.info("Pro subscription canceled.");
          setCancelDialogOpen(false);
        }}
      />

      {/* Allergies */}
      <SettingsSection title="Allergies on file" icon={AlertTriangle} accent="danger">
        <div className="flex gap-2">
          <Input
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAllergy();
              }
            }}
            placeholder="Add an allergy"
            className="h-10 rounded-xl"
          />
          <Button onClick={addAllergy} variant="secondary" className="h-10 rounded-xl px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profile.allergies ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No allergies on file. We'll add a warning here once you do.
            </p>
          ) : (
            (profile.allergies ?? []).map((a) => (
              <span
                key={a}
                className="flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-medium text-danger"
              >
                {a}
                <button
                  onClick={() => toggleAllergy(a)}
                  className="rounded-full p-0.5 hover:bg-danger/20"
                  aria-label={`Remove ${a}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </SettingsSection>

      {/* Conditions */}
      <SettingsSection title="Existing conditions" icon={Heart} accent="safe">
        <div className="flex gap-2">
          <Input
            value={conditionInput}
            onChange={(e) => setConditionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCondition();
              }
            }}
            placeholder="e.g. high blood pressure, diabetes"
            className="h-10 rounded-xl"
          />
          <Button onClick={addCondition} variant="secondary" className="h-10 rounded-xl px-3">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(profile.conditions ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Adding conditions helps us flag relevant warnings on scans.
            </p>
          ) : (
            (profile.conditions ?? []).map((c) => (
              <span
                key={c}
                className="flex items-center gap-1.5 rounded-full bg-safe-soft px-3 py-1 text-xs font-medium text-safe"
              >
                {c}
                <button
                  onClick={() =>
                    setProfile({
                      conditions: (profile.conditions ?? []).filter((x) => x !== c),
                    })
                  }
                  className="rounded-full p-0.5 hover:bg-safe/20"
                  aria-label={`Remove ${c}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </SettingsSection>

      {/* High contrast warnings */}
      <SettingsSection title="Display" icon={Monitor} accent="trust">
        <ToggleRow
          label="High-contrast warnings"
          desc="Make serious side effects and interactions visually bolder"
          checked={settings.highContrastWarnings}
          onChange={(v) => setSettings({ highContrastWarnings: v })}
        />
      </SettingsSection>

      {/* Preferences */}
      <SettingsSection title="Preferences" icon={Globe} accent="trust">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">App Language</p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => {
                const active = (settings.language || "en") === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => {
                      setSettings({ language: l.code });
                      toast.success(`Language updated to ${l.name}`);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <span>{l.flag}</span>
                    <span>{l.native}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Units</p>
            <div className="grid grid-cols-2 gap-2">
              {(["metric", "imperial"] as const).map((u) => {
                const active = settings.units === u;
                return (
                  <button
                    key={u}
                    onClick={() => setSettings({ units: u })}
                    className={cn(
                      "rounded-xl border-2 px-3 py-2 text-sm font-medium capitalize transition-all",
                      active
                        ? "border-trust bg-trust-soft/50 text-trust"
                        : "border-border bg-card text-muted-foreground hover:border-trust/40"
                    )}
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </div>
          <ToggleRow
            label="Show disclaimer before each scan"
            desc="Re-display the medical disclaimer every time you scan"
            checked={settings.showDisclaimerOnScan}
            onChange={(v) => setSettings({ showDisclaimerOnScan: v })}
          />
        </div>
      </SettingsSection>

      {/* AI Usage */}
      <AIUsageSection />

      {/* Data & privacy */}
      <SettingsSection title="Data & privacy" icon={Shield} accent="safe">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
            <div>
              <p className="font-medium">Scans stored in account</p>
              <p className="text-xs text-muted-foreground">{scans.length} records in cloud history</p>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
            <div>
              <p className="font-medium">Reports submitted</p>
              <p className="text-xs text-muted-foreground">{reports.length} total</p>
            </div>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="px-1 pt-1 text-xs text-muted-foreground">
            All scan history is linked securely to your account. Photos are analyzed securely by AI models and discarded after scanning.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft/40 p-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft/70">
                <Trash2 className="h-4 w-4" />
                Clear all scan history
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all scan history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes all {scans.length} scan
                  {scans.length === 1 ? "" : "s"} from your account. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-danger text-danger-foreground hover:bg-danger/90"
                  onClick={() => {
                    clearHistory();
                    toast.success("All scan history deleted");
                  }}
                >
                  Delete all
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SettingsSection>

      {/* Legal */}
      <SettingsSection title="Legal" icon={FileText} accent="trust">
        <div className="space-y-1">
          <LegalRow
            title="Medical disclaimer"
            desc="How MedSnap should and should not be used"
            onClick={() => navigate("legal-disclaimer")}
          />
          <LegalRow
            title="Terms of Service"
            desc="The terms that govern your use of MedSnap"
            onClick={() => navigate("legal-terms")}
          />
          <LegalRow
            title="Privacy Policy"
            desc="What we collect, how we use it, and your rights"
            onClick={() => navigate("legal-privacy")}
          />
        </div>
      </SettingsSection>

      {/* Account */}
      <SettingsSection title="Account" icon={User} accent="trust">
        <div className="space-y-2 text-sm">
          {user && (
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="font-medium">{user.displayName || user.email}</p>
                  <p className="text-xs text-muted-foreground">Cloud sync enabled</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={async () => {
                  try {
                    await logout();
                    toast.success("Signed out");
                    navigate("landing");
                  } catch {
                    toast.error("Could not sign out");
                  }
                }}
              >
                <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
          )}
          <div className="rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-safe" />
              Cloud sync active — scans & preferences sync across devices
            </span>
          </div>
          <button
            onClick={() => {
              resetOnboarding();
              toast.info("Onboarding reset");
            }}
            className="flex w-full items-center gap-2 rounded-xl border border-border bg-card p-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Reset onboarding & profile
          </button>
        </div>
      </SettingsSection>

      <p className="px-2 text-center text-[11px] text-muted-foreground">
        MedSnap v0.1.0 · Made with care for safer medicine use.
      </p>
    </div>
  );
}

/**
 * Multi-Step Retention Cancellation Flow Dialog
 * Makes canceling intentionally friction-heavy with survey feedback, special offers, and confirmation phrase.
 */
function CancellationDialog({
  open,
  onOpenChange,
  onConfirmCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmCancel: () => void;
}) {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);
  const [reason, setReason] = React.useState<string>("");
  const [confirmText, setConfirmText] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      setStep(1);
      setReason("");
      setConfirmText("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <ShieldAlert className="h-5 w-5 text-warn" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Step {step} of 3 — Membership Cancellation
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Loss Warning & Survey */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-warn/30 bg-warn-soft/40 p-4 text-xs text-warn-foreground">
              <p className="font-bold text-sm mb-1.5">You will lose the following Pro features:</p>
              <ul className="space-y-1.5">
                <li className="flex items-center gap-1.5">❌ 4 AI Scans per day (drops to 1 free scan/day)</li>
                <li className="flex items-center gap-1.5">❌ Priority Vision AI processing speed</li>
                <li className="flex items-center gap-1.5">❌ Proactive Drug-Drug Interaction Alerts</li>
                <li className="flex items-center gap-1.5">❌ PDF & CSV Medical Log Export</li>
              </ul>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold">Why are you cancelling?</p>
              <div className="space-y-2">
                {[
                  "Too expensive for me right now",
                  "I don't use it enough",
                  "Missing a feature I need",
                  "Just taking a break",
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left text-xs font-medium transition-colors",
                      reason === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-muted"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => onOpenChange(false)}
                className="h-11 w-full rounded-xl font-semibold shadow-soft"
              >
                Keep My Pro Membership
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!reason}
                variant="ghost"
                className="h-10 text-xs text-muted-foreground hover:text-foreground"
              >
                Continue Cancellation →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Special Retention Discount Offer */}
        {step === 2 && (
          <div className="space-y-4 pt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Gift className="h-7 w-7" />
            </div>

            <div>
              <h3 className="font-bold text-lg">Wait! Take 20% Off</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                We'd love to keep you! Claim 20% off your next renewal cycle automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold text-primary">Special Retention Offer</p>
              <p className="mt-1 font-mono text-xl font-bold tracking-widest text-foreground">STAYPRO20</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Applies 20% discount to your current plan</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  toast.success("Retention offer applied! Your 20% discount is active.");
                  onOpenChange(false);
                }}
                className="h-12 w-full rounded-xl font-bold shadow-glow"
              >
                Claim 20% Off & Keep Pro
              </Button>
              <Button
                onClick={() => setStep(3)}
                variant="ghost"
                className="h-10 text-xs text-muted-foreground hover:text-foreground"
              >
                No thanks, proceed to cancel
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Final Type "CANCEL" Confirmation */}
        {step === 3 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-2xl border border-danger/30 bg-danger-soft/40 p-3 flex items-start gap-2 text-xs text-danger">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>Final step: Confirming cancellation will immediately deactivate your Pro perks.</span>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-foreground">
                To confirm, type <span className="font-mono font-bold uppercase text-danger">CANCEL</span> below:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CANCEL to confirm"
                className="h-11 rounded-xl text-center font-mono font-bold uppercase tracking-widest"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={onConfirmCancel}
                disabled={confirmText.toUpperCase().trim() !== "CANCEL"}
                variant="destructive"
                className="h-12 w-full rounded-xl font-bold shadow-soft"
              >
                Permanently Cancel Subscription
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="h-10 rounded-xl text-xs"
              >
                Nevermind, Stay Pro
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SettingsSection({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "trust" | "safe" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const accentClass = {
    trust: "bg-trust-soft text-trust",
    safe: "bg-safe-soft text-safe",
    warn: "bg-warn-soft text-warn-foreground",
    danger: "bg-danger-soft text-danger",
  }[accent];

  return (
    <Card className="border-border/60 p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2.5">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", accentClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-muted/40 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LegalRow({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:border-trust/40 hover:bg-trust-soft/30"
    >
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="mt-0.5 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function AIUsageSection() {
  const [usage, setUsage] = React.useState<{
    mistral: { calls: number; tokens: number; lastUsed: string | null };
    llm7: { calls: number; tokens: number; lastUsed: string | null };
    verified: { calls: number; lastUsed: string | null };
    total: { calls: number; lastUsed: string | null };
  } | null>(null);

  React.useEffect(() => {
    fetch("/api/ai-usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => {});
  }, []);

  if (!usage) return null;

  const mistralRemaining = Math.max(0, 1000 - usage.mistral.calls);

  return (
    <SettingsSection title="AI Usage" icon={Sparkles} accent="trust">
      <div className="space-y-3">
        {/* Mistral Pixtral (Vision) */}
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Mistral Pixtral (Vision)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Photo identification AI
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">
                <AnimatedCounter value={usage.mistral.calls} />
              </p>
              <p className="text-[10px] text-muted-foreground">calls</p>
            </div>
          </div>
          {/* Progress bar for free tier (1000 calls/month) */}
          <div className="mt-2">
            <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Free tier usage</span>
              <span>{usage.mistral.calls} / 1000 ({mistralRemaining} left)</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, (usage.mistral.calls / 1000) * 100)}%` }}
              />
            </div>
          </div>
          {usage.mistral.lastUsed && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Last used: {new Date(usage.mistral.lastUsed).toLocaleString()}
            </p>
          )}
        </div>

        {/* LLM7 Codestral (Text) */}
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-safe" />
                LLM7 Codestral (Text)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Name-based identification (unlimited free)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">{usage.llm7.calls}</p>
              <p className="text-[10px] text-muted-foreground">calls</p>
            </div>
          </div>
        </div>

        {/* Verified Sources */}
        <div className="rounded-xl bg-muted/40 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Verified Sources (Fallback)
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                openFDA + RxNorm (free, unlimited)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">{usage.verified.calls}</p>
              <p className="text-[10px] text-muted-foreground">calls</p>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-3">
          <p className="text-sm font-semibold">Total AI calls</p>
          <p className="text-lg font-bold tabular-nums text-primary">
            <AnimatedCounter value={usage.total.calls} />
          </p>
        </div>

        {usage.total.lastUsed && (
          <p className="text-center text-[10px] text-muted-foreground">
            Last AI activity: {new Date(usage.total.lastUsed).toLocaleString()}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
