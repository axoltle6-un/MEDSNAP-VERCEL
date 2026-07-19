"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { safeFetch } from "@/lib/safe-fetch";
import { fireConfetti } from "@/lib/confetti";

/**
 * Custom Hook: Intercepts returning visitors from Stripe Checkout (`/?stripe_success=true&plan=monthly&session_id=...`).
 * Automatically activates the Pro tier in the local Zustand store and verifies the session on the backend.
 */
export function useStripeSuccess() {
  const activatePro = useAppStore((s) => s.activatePro);
  const navigate = useAppStore((s) => s.navigate);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get("stripe_success") === "true";
    const isCancel = params.get("stripe_cancel") === "true";
    const planParam = params.get("plan") === "yearly" ? "yearly" : "monthly";
    const sessionId = params.get("session_id");

    if (isSuccess) {
      // 1. Immediately unlock Pro locally & trigger celebratory confetti
      activatePro(planParam);
      fireConfetti({ particleCount: 75 });
      toast.success("🎉 Subscription Successful! MedSnap Pro is active.", {
        description: "Enjoy 4 daily AI scans, medical log export, and interaction alerts.",
        duration: 6000,
      });

      // 2. Verify with backend session endpoint
      if (sessionId) {
        safeFetch("/api/stripe/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }).catch((err) => {
          console.warn("[useStripeSuccess] Verification ping warn:", err);
        });
      }

      // 3. Clean up URL parameters seamlessly without reloading page
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      // 4. Navigate directly to app home dashboard
      navigate("home");
    } else if (isCancel) {
      toast.info("Checkout canceled. You are still on the Free plan.");
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [activatePro, navigate]);
}
