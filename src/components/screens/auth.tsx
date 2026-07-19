"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import { safeFetch } from "@/lib/safe-fetch";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";

type Mode = "signin" | "signup";

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle, isFirebaseEnabled, refreshUser } = useAuth();
  const navigate = useAppStore((s) => s.navigate);
  const [mode, setMode] = React.useState<Mode>("signin");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [transitioning, setTransitioning] = React.useState(false);

  // Email verification flow state
  const [showVerifyScreen, setShowVerifyScreen] = React.useState(false);
  const [verified, setVerified] = React.useState(false);
  const [verifyCode, setVerifyCode] = React.useState(["", "", "", "", "", ""]);
  const [verifyLoading, setVerifyLoading] = React.useState(false);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const verifyRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters long.");
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          throw new Error("Password must contain uppercase, lowercase, number, and special character.");
        }
        await signUp(email, password, name);
        toast.success("Account created — check your email for a verification code");
        setLoading(false); setTransitioning(true);
        await new Promise(r => setTimeout(r, 1500));
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        setLoading(false); setTransitioning(true);
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (err) {
      const errAny = err as any;
      const msg = (err instanceof Error ? err.message : "Authentication failed.").toLowerCase();
      const code = (errAny?.code || "").toLowerCase();
      const matches = (...patterns: string[]) =>
        patterns.some((p) => msg.includes(p) || code.includes(p));

      if (matches("invalid-credential", "wrong-password", "invalid-login", "user-not-found", "invalid-login-credentials"))
        setError("Incorrect email or password. Please check and try again.");
      else if (matches("email-already-in-use"))
        setError("An account with this email already exists. Try signing in instead.");
      else if (matches("invalid-email"))
        setError("Please enter a valid email address.");
      else if (matches("too-many-requests"))
        setError("Too many attempts. Please wait a moment and try again.");
      else if (matches("unverified", "not-verified"))
        setError("Please verify your email first.");
      else if (matches("network", "network-error", "network-request-failed"))
        setError("Network error. Check your connection and try again.");
      else if (matches("unauthorized-domain", "auth/unauthorized", "unauthorized_domain"))
        setError("Domain unauthorized: Add your Vercel URL to Firebase Console > Authentication > Settings > Authorized domains.");
      else if (matches("internal-error", "auth/internal-error"))
        setError("Firebase internal error: Ensure Email/Password sign-in is enabled in Firebase Console and NEXT_PUBLIC_FIREBASE_API_KEY is valid in Vercel.");
      else if (matches("popup-closed", "cancelled-popup-request"))
        setError("Sign-in popup was closed. Please try again.");
      else if (matches("popup-request-blocked"))
        setError("Popup was blocked by your browser. Please allow popups and try again.");
      else
        setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setError(null); setLoading(true);
    try {
      await signInWithGoogle(); toast.success("Signed in with Google!");
      setLoading(false); setTransitioning(true);
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google sign-in failed.";
      if (!msg.includes("popup-closed-by-user")) setError(msg);
    } finally { setLoading(false); }
  }

  async function sendVerificationCode() {
    setVerifyError(null);
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
        toast.success("Email already verified — signing you in");
        setShowVerifyScreen(false);
        setLoading(true); setTransitioning(true);
        await new Promise(r => setTimeout(r, 1200));
        return;
      }
      if (json?.devMode && json?.devCode) {
        setDevCode(json.devCode);
        toast.info("SMTP not configured — dev code shown below");
      } else {
        toast.success("Verification code sent to your email");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send verification code";
      setVerifyError(msg);
    }
  }

  const verifyRef = React.useRef<((codeStr: string) => Promise<void>) | null>(null);

  function handleVerifyCodeChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...verifyCode];
    newCode[idx] = value;
    setVerifyCode(newCode);
    if (value && idx < 5) verifyRefs.current[idx + 1]?.focus();

    if (value && newCode.every((d) => d !== "")) {
      const codeStr = newCode.join("");
      setTimeout(() => verifyRef.current?.(codeStr), 200);
    }
  }

  function handleVerifyCodeKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !verifyCode[idx] && idx > 0) {
      verifyRefs.current[idx - 1]?.focus();
    }
  }

  function handleVerifyCodePaste(e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) {
    const pasted = e.clipboardData.getData("text").trim();
    const digits = pasted.replace(/\D/g, "");

    if (digits.length === 6) {
      e.preventDefault();
      const newCode = digits.split("");
      setVerifyCode(newCode);
      verifyRefs.current[5]?.focus();
      setTimeout(() => verifyRef.current?.(digits), 200);
    } else if (digits.length > 0) {
      e.preventDefault();
      const newCode = [...verifyCode];
      for (let i = 0; i < Math.min(digits.length, 6 - startIdx); i++) {
        newCode[startIdx + i] = digits[i];
      }
      setVerifyCode(newCode);
      const lastFilled = Math.min(startIdx + digits.length - 1, 5);
      verifyRefs.current[lastFilled]?.focus();
      if (newCode.every((d) => d !== "")) {
        setTimeout(() => verifyRef.current?.(newCode.join("")), 200);
      }
    }
  }

  async function confirmVerification(e?: React.FormEvent | string) {
    if (e && typeof e !== "string") e.preventDefault();
    const codeStr = typeof e === "string" ? e : verifyCode.join("");
    setVerifyError(null);
    if (codeStr.length !== 6) {
      setVerifyError("Please enter the 6-digit code");
      return;
    }
    setVerifyLoading(true);
    try {
      const result = await safeFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeStr }),
      });
      if (!result.ok) throw new Error(result.error || "Verification failed");

      toast.success("Email verified — welcome to MedSnap");
      setVerified(true);

      await refreshUser();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Verification failed";
      setVerifyError(msg);
      setVerifyCode(["", "", "", "", "", ""]);
      verifyRefs.current[0]?.focus();
    } finally {
      setVerifyLoading(false);
    }
  }

  verifyRef.current = async (codeStr: string) => { await confirmVerification(codeStr); };

  if (showVerifyScreen) {
    if (verified) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-safe-soft"
            >
              <Check className="h-8 w-8 text-safe" />
            </motion.div>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Email verified! Loading MedSnap…
            </p>
            <div className="throbber throbber-lg mt-4" />
          </motion.div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8">
        {transitioning && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
            <div className="throbber throbber-lg" />
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[380px]">
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-xl font-bold">Verify your email</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{email}</strong>. Enter it below — or just paste it.
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

          <form onSubmit={(e) => { e.preventDefault(); confirmVerification(); }} className="space-y-4">
            <div className="flex justify-center gap-2">
              {verifyCode.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { verifyRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  autoFocus={i === 0}
                  onChange={(e) => handleVerifyCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleVerifyCodeKeyDown(i, e)}
                  onPaste={(e) => handleVerifyCodePaste(e, i)}
                  disabled={verifyLoading}
                  className="h-14 w-12 rounded-xl border border-border bg-card text-center text-xl font-bold focus:border-primary focus:outline-none disabled:opacity-50"
                />
              ))}
            </div>
            {verifyError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger-soft p-2.5 text-xs text-danger">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{verifyError}</span>
              </div>
            )}
            <Button type="submit" disabled={verifyLoading} className="h-11 w-full rounded-lg font-medium">
              {verifyLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify email"}
            </Button>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { setShowVerifyScreen(false); setVerifyCode(["","","","","",""]); setVerifyError(null); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={sendVerificationCode}
                disabled={verifyLoading}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                Resend code
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

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-background px-5 py-8">
      {transitioning && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
          <Logo size={56} animated />
          <div className="throbber throbber-lg mt-6" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">
            {mode === "signup" ? "Creating your account…" : "Signing you in…"}
          </p>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-[380px]">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center"><Logo size={44} animated={false} /></div>
          <h1 className="font-display text-xl font-bold">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Sign in to your MedSnap account" : "Join MedSnap to start scanning"}</p>
        </div>

        <div className="mb-5 flex rounded-lg bg-muted p-1">
          {(["signin", "signup"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(null); }}
              className={cn("relative flex-1 rounded-md py-2 text-sm font-medium transition-colors", mode === m ? "text-white" : "text-muted-foreground hover:text-foreground")}>
              {mode === m && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 rounded-md bg-primary" />}
              <span className="relative z-10">{m === "signin" ? "Sign in" : "Sign up"}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <>
              {/* Goal Gradient Head Start Progress Indicator */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between text-xs font-bold text-primary mb-1">
                  <span>Progress: 25%</span>
                  <span>Step 1 of 2 — Profile Initialization</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-1/4 transition-all duration-300" />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-muted-foreground">Full name</Label>
                <div className="relative mt-1">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" className="h-11 rounded-lg pl-10" />
                </div>
              </div>
            </>
          )}

          <div>
            <Label className="text-xs font-medium text-muted-foreground">Email</Label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="h-11 rounded-lg pl-10" required />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              {mode === "signin" && <button type="button" onClick={() => navigate("reset-password")} className="text-xs font-medium text-primary hover:underline">Forgot password?</button>}
            </div>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" className="h-11 rounded-lg pl-10 pr-10" required />
              <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-soft p-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg font-bold shadow-soft">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign in" : "Save Health Profile & Create Account"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button type="button" onClick={handleGoogle} disabled={loading || !isFirebaseEnabled}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50">
          <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continue with Google
        </button>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Google accounts skip email verification — Google has already verified your email.
        </p>
      </motion.div>
    </div>
  );
}
