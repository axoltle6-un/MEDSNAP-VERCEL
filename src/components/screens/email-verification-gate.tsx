"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle, Loader2, LogOut, Clock, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "sonner";
import { AnimatedSuccessCheckmark } from "@/components/ui/animated-checkmark";

const RESEND_COOLDOWN_SEC = 30;

/**
 * Gate shown when a user is signed in with email+password but hasn't verified
 * their email yet. Google sign-in users never see this.
 *
 * Features:
 *  - Paste support: paste a 6-digit code into ANY box → fills all boxes
 *  - Auto-submit: when all 6 digits are entered, verification runs automatically
 *  - No "Verify" button needed (but still present as fallback)
 *  - After verification: refreshes user state → page.tsx redirects automatically
 */
export function EmailVerificationGate() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useAppStore((s) => s.navigate);
  const email = user?.email || "";

  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = React.useState(false);
  const [sendLoading, setSendLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [cooldown, setCooldown] = React.useState(0);
  const [verified, setVerified] = React.useState(false);
  const codeRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const hasSentRef = React.useRef(false);
  const verifyRef = React.useRef<((codeStr: string) => Promise<void>) | null>(null);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto-send a code on mount (only once)
  React.useEffect(() => {
    if (email && !hasSentRef.current) {
      hasSentRef.current = true;
      void sendCode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function sendCode(isAutoSend = false) {
    setSendLoading(true);
    setError(null);
    setDevCode(null);
    try {
      const result = await safeFetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!result.ok) throw new Error(result.error || "Failed to send code");
      const json = result.data as any;
      if (json?.alreadyVerified) {
        await refreshUser();
        return;
      }
      if (json?.devMode && json?.devCode) {
        setDevCode(json.devCode);
        toast.info("SMTP not configured — dev code shown below");
      } else {
        toast.success(`Verification code sent to ${email}`);
      }
      if (!isAutoSend) {
        setCooldown(RESEND_COOLDOWN_SEC);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code";
      setError(msg);
    } finally {
      setSendLoading(false);
    }
  }

  /**
   * Handle paste events — if the pasted text is a 6-digit code, fill all boxes
   * and auto-submit.
   */
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) {
    const pasted = e.clipboardData.getData("text").trim();
    // Extract only digits from the pasted text
    const digits = pasted.replace(/\D/g, "");

    if (digits.length === 6) {
      e.preventDefault();
      const newCode = digits.split("");
      setCode(newCode);
      // Focus the last box so the user sees all boxes filled
      codeRefs.current[5]?.focus();
      // Auto-submit after a brief delay (lets the UI update)
      setTimeout(() => {
        verifyRef.current?.(digits);
      }, 200);
    } else if (digits.length > 0) {
      // Partial paste — fill as many boxes as we can starting from startIdx
      e.preventDefault();
      const newCode = [...code];
      for (let i = 0; i < Math.min(digits.length, 6 - startIdx); i++) {
        newCode[startIdx + i] = digits[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(startIdx + digits.length - 1, 5);
      codeRefs.current[lastFilled]?.focus();

      // If we filled all 6, auto-submit
      if (newCode.every((d) => d !== "")) {
        setTimeout(() => {
          verifyRef.current?.(newCode.join(""));
        }, 200);
      }
    }
  }

  function handleChange(idx: number, value: string) {
    // Only accept single digits
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);
    if (value && idx < 5) codeRefs.current[idx + 1]?.focus();

    // Auto-submit when all 6 digits are filled
    if (value && newCode.every((d) => d !== "")) {
      const codeStr = newCode.join("");
      setTimeout(() => {
        verifyRef.current?.(codeStr);
      }, 200);
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  async function verify(codeStr?: string) {
    const finalCode = codeStr || code.join("");
    if (finalCode.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await safeFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: finalCode }),
      });
      if (!result.ok) throw new Error(result.error || "Verification failed");

      toast.success("Email verified — welcome to MedSnap");
      setVerified(true);

      // Force-refresh the user state. The version counter in refreshUser
      // will cause page.tsx to re-render and detect emailVerified: true.
      // page.tsx will then route to onboarding (if not complete) or home.
      await refreshUser();

      // Don't navigate here — let page.tsx decide where to go based on
      // onboardingComplete state. It will automatically show onboarding
      // for new users or home for returning users.
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setError(msg);
      setCode(["", "", "", "", "", ""]);
      codeRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  // Keep the ref updated so paste/autocomplete handlers can call it
  verifyRef.current = verify;

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      navigate("landing");
    } catch {
      toast.error("Could not sign out");
    }
  }

  // Show a "verified" state with animated checkmark while waiting for the redirect
  if (verified) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <AnimatedSuccessCheckmark size={64} color="#10b981" />
          <p className="mt-4 text-sm font-semibold text-foreground">
            Email verified! Loading MedSnap…
          </p>
          <div className="throbber throbber-md mt-4" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold">Verify your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{email}</strong>.
            Enter it below — or just paste it.
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            Check your spam folder if you don't see it.
          </p>
        </div>

        {devCode && (
          <div className="mb-4 rounded-xl bg-warn-soft/60 p-3 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warn-foreground">
              Dev mode (SMTP not configured)
            </p>
            <p className="mt-1 text-lg font-bold tracking-widest text-warn-foreground">{devCode}</p>
            <p className="mt-1 text-[11px] text-warn-foreground/70">In production this would arrive by email.</p>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="space-y-4">
          <div className="flex justify-center gap-2">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoFocus={i === 0}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={(e) => handlePaste(e, i)}
                disabled={loading}
                className="h-14 w-12 rounded-xl border border-border bg-card text-center text-xl font-bold focus:border-primary focus:outline-none disabled:opacity-50"
              />
            ))}
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft p-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}
          <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg font-medium">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify email"}
          </Button>
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
            <button
              type="button"
              onClick={() => sendCode(false)}
              disabled={sendLoading || cooldown > 0}
              className="flex items-center gap-1 text-sm text-primary hover:underline disabled:opacity-50"
            >
              {sendLoading ? (
                "Sending…"
              ) : cooldown > 0 ? (
                <><Clock className="h-3.5 w-3.5" /> Resend in {cooldown}s</>
              ) : (
                "Resend code"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground">
          <strong className="text-foreground">Tip:</strong> You can paste the full 6-digit code
          into any box — it'll auto-fill and verify instantly.
        </div>
      </motion.div>
    </div>
  );
}
