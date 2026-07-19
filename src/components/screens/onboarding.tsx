"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart, Users, Activity, Sparkles, Camera, ShieldCheck,
  ChevronRight, ChevronLeft, Check, AlertTriangle, Calendar, Cake,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Logo } from "@/components/brand/logo";
import type { OnboardingRole } from "@/lib/types";

const STEPS = ["splash", "role", "medication", "age", "allergies", "value-prop"] as const;
type Step = (typeof STEPS)[number];

const ROLES = [
  { id: "personal" as OnboardingRole, title: "Personal use", desc: "I take meds and want to double-check what's in my cabinet.", icon: Heart },
  { id: "caregiver" as OnboardingRole, title: "Caregiver", desc: "I manage medication for someone I care for.", icon: Users },
  { id: "elderly-parent" as OnboardingRole, title: "Elderly parent", desc: "Helping an aging parent keep track of prescriptions.", icon: Activity },
  { id: "curiosity" as OnboardingRole, title: "Just curious", desc: "I want to understand medicines I come across.", icon: Sparkles },
];

const COMMON_ALLERGIES = ["Penicillin", "Sulfa drugs", "Aspirin", "Ibuprofen", "Codeine", "Amoxicillin", "Tetracycline", "Erythromycin"];

export function OnboardingScreen() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const navigate = useAppStore((s) => s.navigate);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = React.useState<Step>("splash");
  const [allergyInput, setAllergyInput] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const stepIndex = STEPS.indexOf(step);
  const isLast = step === "value-prop";

  function next() { const i = STEPS.indexOf(step); if (i < STEPS.length - 1) setStep(STEPS[i + 1]); }
  function back() { const i = STEPS.indexOf(step); if (i > 0) setStep(STEPS[i - 1]); }

  function toggleAllergy(a: string) {
    const cur = profile.allergies ?? [];
    setProfile({ allergies: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  }
  function addCustomAllergy() {
    const v = allergyInput.trim();
    if (!v || (profile.allergies ?? []).includes(v)) return;
    setProfile({ allergies: [...(profile.allergies ?? []), v] });
    setAllergyInput("");
  }

  // Calculate age from birthday
  const age = React.useMemo(() => {
    if (!birthday) return null;
    const today = new Date();
    const birth = new Date(birthday);
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a >= 0 && a < 150 ? a : null;
  }, [birthday]);

  function saveAgeAndContinue() {
    if (age !== null) {
      setProfile({ conditions: [...(profile.conditions ?? []).filter(c => !c.startsWith("Age:")), `Age: ${age}`] });
    }
    next();
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-3 md:px-6">
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= stepIndex ? "bg-primary" : "bg-muted")} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        {stepIndex > 0 ? (
          <button onClick={back} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button>
        ) : (
          <span className="text-xs font-bold text-primary">Progress: {Math.max(20, Math.round(((stepIndex + 1) / STEPS.length) * 100))}% · Step {stepIndex + 1} of {STEPS.length}</span>
        )}
        <button onClick={() => completeOnboarding()} className="text-sm text-muted-foreground hover:text-foreground">Skip</button>
      </div>

      <div className="flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.28, ease: "easeOut" }}>
              {step === "splash" && (
                <div className="text-center">
                  <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="mx-auto mb-5">
                    <Logo size={80} showPulse animated />
                  </motion.div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">MedSnap</h1>
                  <p className="mx-auto mt-2 max-w-[18rem] text-[15px] leading-relaxed text-muted-foreground">Point your camera at any medicine. Know exactly what it is before you take it.</p>
                  <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-2">
                    {[{ icon: Camera, label: "Scan" }, { icon: ShieldCheck, label: "Verify" }, { icon: Sparkles, label: "Decide" }].map(s => {
                      const Icon = s.icon;
                    return <div key={s.label} className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3"><div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><span className="text-[11px] font-medium text-muted-foreground">{s.label}</span></div>;
                  })}
                </div>
              </div>
            )}

            {step === "role" && (
              <div>
                <h1 className="font-display text-2xl font-bold text-balance">Why are you using MedSnap?</h1>
                <p className="mt-2 text-sm text-muted-foreground">We'll personalize warnings and reminders based on your answer.</p>
                <div className="mt-5 space-y-2.5">
                  {ROLES.map(r => {
                    const Icon = r.icon;
                    const active = profile.role === r.id;
                    return (
                      <button key={r.id} onClick={() => { setProfile({ role: r.id }); setTimeout(next, 180); }}
                        className={cn("group flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all", active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors", active ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:text-primary")}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1"><p className="font-semibold">{r.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p></div>
                        {active && <Check className="h-5 w-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "medication" && (
              <div>
                <h1 className="font-display text-2xl font-bold text-balance">Do you take medication regularly?</h1>
                <p className="mt-2 text-sm text-muted-foreground">This helps us show interaction warnings more prominently.</p>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {[{ v: true, label: "Yes, daily", desc: "I take one or more prescription meds every day." }, { v: false, label: "Occasionally", desc: "Only OTC meds or short prescriptions here and there." }].map(o => {
                    const active = profile.takesMedicationRegularly === o.v;
                    return (
                      <button key={String(o.v)} onClick={() => { setProfile({ takesMedicationRegularly: o.v }); setTimeout(next, 180); }}
                        className={cn("flex w-full items-start gap-3 rounded-lg border-2 p-4 text-left transition-all", active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40")}>
                        <div className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", active ? "border-primary bg-primary text-white" : "border-muted-foreground/40")}>
                          {active && <Check className="h-3.5 w-3.5" />}
                        </div>
                        <div><p className="font-semibold">{o.label}</p><p className="mt-0.5 text-xs text-muted-foreground">{o.desc}</p></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === "age" && (
              <div>
                <h1 className="font-display text-2xl font-bold text-balance">When were you born?</h1>
                <p className="mt-2 text-sm text-muted-foreground">We use your age to flag age-specific warnings (e.g. children &lt; 12, elderly 65+).</p>
                <div className="mt-6">
                  <Label className="text-xs font-medium text-muted-foreground">Date of birth</Label>
                  <div className="relative mt-1.5">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="h-12 rounded-lg pl-10" max={new Date().toISOString().split("T")[0]} />
                  </div>
                  {age !== null && (
                    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-2 rounded-lg bg-primary/5 p-3">
                      <Cake className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">You are {age} years old</span>
                    </motion.div>
                  )}
                </div>
                <Button onClick={saveAgeAndContinue} disabled={!birthday || age === null} className="mt-6 h-12 w-full rounded-lg">Continue <ChevronRight className="ml-1 h-4 w-4" /></Button>
              </div>
            )}

            {step === "allergies" && (
              <div>
                <h1 className="font-display text-2xl font-bold text-balance">Any known allergies?</h1>
                <p className="mt-2 text-sm text-muted-foreground">We'll flag medicines that contain those ingredients.</p>
                <div className="mt-5 flex gap-2">
                  <Input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomAllergy(); } }} placeholder="Add an allergy (e.g. Latex)" className="h-11 rounded-lg" />
                  <Button onClick={addCustomAllergy} variant="secondary" className="h-11 rounded-lg px-4">Add</Button>
                </div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Common allergies</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COMMON_ALLERGIES.map(a => {
                    const active = (profile.allergies ?? []).includes(a);
                    return <button key={a} onClick={() => toggleAllergy(a)} className={cn("rounded-full border-2 px-3.5 py-1.5 text-sm font-medium transition-all", active ? "border-danger bg-danger-soft text-danger" : "border-border bg-card text-foreground hover:border-danger/40")}>{active && <Check className="mr-1 inline h-3.5 w-3.5" />}{a}</button>;
                  })}
                </div>
                {(profile.allergies ?? []).length > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg bg-danger-soft/60 p-3 text-sm text-danger">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{profile.allergies?.length} allerg{(profile.allergies?.length ?? 0) > 1 ? "ies" : "y"} on file — we'll warn you if a scanned medicine matches.</span>
                  </div>
                )}
              </div>
            )}

            {step === "value-prop" && (
              <div className="text-center">
                <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: "easeOut" }} className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-lifted">
                  <Camera className="h-10 w-10" strokeWidth={2} />
                </motion.div>
                <h1 className="mt-5 font-display text-2xl font-bold leading-tight text-balance">Point your camera at any medicine.</h1>
                <p className="mx-auto mt-2 max-w-[18rem] text-base text-muted-foreground text-balance">Know exactly what it is before you take it — brand, strength, uses, side effects, interactions, and who should avoid it.</p>
                <div className="mx-auto mt-5 max-w-sm space-y-2.5 text-left">
                  {[{ icon: Camera, title: "Snap a photo", desc: "Pill, capsule, syrup, or box." }, { icon: ShieldCheck, title: "Verify with sources", desc: "Cross-checked against openFDA, RxNorm, and DailyMed." }, { icon: AlertTriangle, title: "See warnings first", desc: "Allergies, interactions, and serious side effects surfaced above the fold." }].map(f => {
                    const Icon = f.icon;
                    return <div key={f.title} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div><div><p className="font-semibold text-sm">{f.title}</p><p className="text-xs text-muted-foreground">{f.desc}</p></div></div>;
                  })}
                </div>
                <div className="mt-5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground"><strong className="text-foreground">A quick note:</strong> MedSnap is a general information tool and not a substitute for professional medical advice. Always consult a doctor or pharmacist.</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="space-y-3">
        <Button onClick={() => isLast ? completeOnboarding() : next()} disabled={(step === "role" && !profile.role) || (step === "medication" && profile.takesMedicationRegularly === null) || (step === "age" && (!birthday || age === null))} size="lg" className="h-12 w-full rounded-lg text-base font-semibold">
          {isLast ? "Start scanning" : step === "age" ? "Continue" : "Continue"}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        {isLast ? (
          <button onClick={() => navigate("paywall")} className="w-full text-center text-sm font-medium text-primary hover:underline">See MedSnap Pro →</button>
        ) : (
          <button onClick={() => completeOnboarding()} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">Set up later</button>
        )}
      </div>
    </div>
  );
}
