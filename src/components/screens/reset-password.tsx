"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "sonner";

type Step = "email" | "code" | "new-password" | "done";

export function ResetPasswordScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const navigate = useAppStore((s) => s.navigate);
  const { isFirebaseEnabled } = useAuth();

  const [step, setStep] = React.useState<Step>("email");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);

  const codeRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const passwordChecks = [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Contains a number", met: /\d/.test(newPassword) },
    { label: "Contains special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDevCode(null);
    setLoading(true);
    try {
      const result = await safeFetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!result.ok) throw new Error(result.error || "Failed to send reset code");
      const json = result.data as any;
      if (json?.devMode && json?.devCode) {
        setDevCode(json.devCode);
        toast.info("SMTP not configured — dev code shown below");
      } else {
        toast.success("Reset code sent to your email");
      }
      setStep("code");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(idx: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newCode = [...code];
    newCode[idx] = value;
    setCode(newCode);
    if (value && idx < 5) codeRefs.current[idx + 1]?.focus();

    // Auto-advance to next step when all 6 digits are filled
    if (value && newCode.every((d) => d !== "")) {
      setTimeout(() => setStep("new-password"), 300);
    }
  }

  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus();
    }
  }

  /**
   * Handle paste events — if the pasted text is a 6-digit code, fill all boxes
   * and auto-advance to the next step.
   */
  function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>, startIdx: number) {
    const pasted = e.clipboardData.getData("text").trim();
    const digits = pasted.replace(/\D/g, "");

    if (digits.length === 6) {
      e.preventDefault();
      const newCode = digits.split("");
      setCode(newCode);
      codeRefs.current[5]?.focus();
      // Auto-advance to next step
      setTimeout(() => setStep("new-password"), 300);
    } else if (digits.length > 0) {
      e.preventDefault();
      const newCode = [...code];
      for (let i = 0; i < Math.min(digits.length, 6 - startIdx); i++) {
        newCode[startIdx + i] = digits[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(startIdx + digits.length - 1, 5);
      codeRefs.current[lastFilled]?.focus();
      if (newCode.every((d) => d !== "")) {
        setTimeout(() => setStep("new-password"), 300);
      }
    }
  }

  // The code is verified TOGETHER with the new password on the next step,
  // so we just need 6 digits entered before allowing the user to proceed.
  function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.join("").length === 6) {
      setStep("new-password");
    } else {
      setError("Please enter the 6-digit code");
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordChecks.every(c => c.met)) {
      setError("Please meet all password requirements");
      return;
    }
    setLoading(true);
    try {
      const result = await safeFetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          code: code.join(""),
          newPassword,
        }),
      });
      if (!result.ok) {
        throw new Error(result.error || "Failed to reset password");
      }
      setStep("done");
      toast.success("Password reset successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset password";
      setError(msg);
      // If the code was invalid/expired, send the user back to the code step
      if (msg.toLowerCase().includes("code") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("attempt")) {
        setCode(["", "", "", "", "", ""]);
        setStep("code");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <button onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[380px]"
        >
          {step === "email" && (
            <form onSubmit={sendResetEmail} className="space-y-5">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold">Reset password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we'll send a 6-digit verification code to reset your password.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 rounded-xl pl-10 border-border bg-card" required />
                </div>
              </div>
              {error && <div className="flex items-start gap-2 rounded-xl bg-danger-soft/50 p-3 text-xs text-danger"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span></div>}
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send reset code
              </Button>
            </form>
          )}

          {step === "code" && (
            <form onSubmit={verifyCode} className="space-y-5">
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold">Enter code</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>
              {devCode && (
                <div className="rounded-xl bg-warn-soft/60 p-3 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warn-foreground">
                    Dev mode (SMTP not configured)
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-widest text-warn-foreground">{devCode}</p>
                  <p className="mt-1 text-[11px] text-warn-foreground/70">In production this would arrive by email.</p>
                </div>
              )}
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
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onPaste={(e) => handleCodePaste(e, i)}
                    className="h-14 w-12 rounded-xl border border-border bg-card text-center text-xl font-bold focus:border-primary focus:outline-none"
                  />
                ))}
              </div>
              {error && <div className="flex items-start gap-2 rounded-xl bg-danger-soft/50 p-3 text-xs text-danger"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span></div>}
              <Button type="submit" className="h-12 w-full rounded-xl">Verify code</Button>
              <p className="text-center text-[11px] text-muted-foreground">
                Tip: You can paste the full 6-digit code into any box.
              </p>
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setStep("email")} className="text-sm text-muted-foreground hover:text-foreground">← Change email</button>
                <button
                  type="button"
                  onClick={sendResetEmail}
                  disabled={loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}

          {step === "new-password" && (
            <form onSubmit={resetPassword} className="space-y-5">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-safe-soft">
                  <Check className="h-5 w-5 text-safe" />
                </div>
                <h1 className="font-display text-2xl font-bold">New password</h1>
                <p className="mt-2 text-sm text-muted-foreground">Create a strong password for your account</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">New password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="h-12 rounded-xl pl-10 pr-10 border-border bg-card" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {/* Password requirements */}
              <div className="space-y-2">
                {passwordChecks.map((check) => (
                  <div key={check.label} className="flex items-center gap-2 text-xs">
                    <div className={cn("flex h-4 w-4 items-center justify-center rounded-full", check.met ? "bg-safe text-safe-foreground" : "bg-muted text-muted-foreground")}>
                      {check.met && <Check className="h-3 w-3" />}
                    </div>
                    <span className={check.met ? "text-safe" : "text-muted-foreground"}>{check.label}</span>
                  </div>
                ))}
              </div>
              {error && <div className="flex items-start gap-2 rounded-xl bg-danger-soft/50 p-3 text-xs text-danger"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>{error}</span></div>}
              <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Reset password
              </Button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-safe-soft">
                <Check className="h-8 w-8 text-safe" />
              </motion.div>
              <h1 className="font-display text-2xl font-bold">Password reset</h1>
              <p className="mt-2 text-sm text-muted-foreground">Your password has been successfully reset. You can now sign in with your new password.</p>
              <Button onClick={() => navigate("auth")} className="mt-6 h-12 w-full rounded-xl">Back to sign in</Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
