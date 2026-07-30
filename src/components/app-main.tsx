"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useAuthBridge } from "@/lib/use-auth-bridge";
import { useStripeSuccess } from "@/lib/use-stripe-success";
import { useUrlSync } from "@/lib/use-url-sync";
import { AppShell } from "@/components/layout/app-shell";
import { AuthScreen } from "@/components/screens/auth";
import { LandingScreen } from "@/components/screens/landing";
import { ResetPasswordScreen } from "@/components/screens/reset-password";
import { EmailVerificationGate } from "@/components/screens/email-verification-gate";
import { PaywallScreen } from "@/components/screens/paywall";
import { CheckoutScreen } from "@/components/screens/checkout";
import { HomeScreen } from "@/components/screens/home";
import { CaptureScreen } from "@/components/screens/capture";
import { AnalyzingScreen } from "@/components/screens/analyzing";
import { ResultsScreen } from "@/components/screens/results";
import { ResultDetailScreen } from "@/components/screens/result-detail";
import { HistoryScreen } from "@/components/screens/history";
import { SearchScreen } from "@/components/screens/search";
import { BrowseScreen } from "@/components/screens/browse";
import { SettingsScreen } from "@/components/screens/settings";
import { LegalScreen, legalKindFor } from "@/components/screens/legal";
import { LoadingSplash } from "@/components/loading-splash";
import type { Screen } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

const FULLSCREEN_SCREENS: Screen[] = [
  "landing",
  "auth",
  "reset-password",
  "email-verification-gate",
  "paywall",
  "checkout",
  "analyzing",
];

const PUBLIC_SCREENS: Screen[] = [
  "landing",
  "auth",
  "reset-password",
  "legal-disclaimer",
  "legal-terms",
  "legal-privacy",
];

/**
 * Navigation depth. Moving to a deeper screen slides forward; moving to a
 * shallower one slides back — so the motion matches the user's mental model
 * even though this is a state machine rather than real routing.
 */
const DEPTH: Record<string, number> = {
  landing: 0,
  auth: 1,
  "reset-password": 1,
  "email-verification-gate": 1,
  home: 2,
  history: 2,
  browse: 2,
  settings: 2,
  search: 3,
  capture: 3,
  paywall: 3,
  analyzing: 4,
  results: 5,
  "result-detail": 6,
  checkout: 4,
  "legal-disclaimer": 7,
  "legal-terms": 7,
  "legal-privacy": 7,
};

export function AppMain() {
  const screen = useAppStore((s) => s.screen);
  const { user, loading } = useAuth();
  const reduced = useReducedMotion();

  // Bridge Firebase Auth to Zustand store
  useAuthBridge();

  // Automatic listener for returning Stripe Checkout success redirects
  useStripeSuccess();

  let effectiveScreen: Screen = screen;

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com");

  // Routing logic: unauthenticated users may only see public screens
  if (!user) {
    if (!PUBLIC_SCREENS.includes(effectiveScreen)) {
      effectiveScreen = "landing";
    }
  } else if (
    user &&
    !user.emailVerified &&
    !isGoogleUser &&
    effectiveScreen !== "email-verification-gate"
  ) {
    effectiveScreen = "email-verification-gate";
  }

  // Mirror the screen actually being rendered into the address bar
  // (/capture, /browse, ...) and handle browser Back/Forward. Must use
  // effectiveScreen so the URL matches what is on screen after auth gating.
  useUrlSync(effectiveScreen);

  const direction = useNavigationDirection(effectiveScreen);

  if (loading) {
    return <LoadingSplash message="Loading MedSnap…" />;
  }

  const isFullscreen = FULLSCREEN_SCREENS.includes(effectiveScreen);
  const content = renderScreen(effectiveScreen);

  // Reduced motion: swap instantly, no slide or fade choreography.
  if (reduced) {
    return isFullscreen ? (
      <div className="min-h-[100dvh] w-full">{content}</div>
    ) : (
      <AppShell>
        <div className="flex w-full flex-1 flex-col">{content}</div>
      </AppShell>
    );
  }

  if (isFullscreen) {
    return (
      <div className="relative min-h-[100dvh] w-full">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={effectiveScreen}
            // Animated `filter: blur()` was dropped here. It forces a repaint
            // of the whole subtree every frame and was the single most
            // expensive part of this transition on mobile — a scale+fade
            // reads almost identically and stays on the compositor.
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.012 }}
            transition={{
              scale: { type: "spring", stiffness: 400, damping: 34, mass: 0.6 },
              opacity: { duration: 0.18, ease: "easeOut" },
            }}
            className="min-h-[100dvh] w-full"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // Going deeper slides in from the right; going back slides in from the left,
  // so the motion matches the mental model of a stack. Slightly larger travel
  // than before, with a subtle depth cue (scale) so screens feel layered
  // rather than sliding on a flat plane.
  const offset = direction === "back" ? -28 : 28;

  return (
    <AppShell>
      {/*
        mode="popLayout" instead of "wait".

        "wait" serialises the transition: the outgoing screen must finish
        exiting (180ms) before the incoming one starts (~165ms), so every
        navigation cost ~345ms AND showed a blank frame in the middle where
        neither screen was painted. popLayout takes the exiting screen out of
        layout flow so both animate at once — same easing, roughly half the
        perceived duration, and no empty gap.
      */}
      <div className="relative flex w-full flex-1 flex-col">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={effectiveScreen}
            initial={{ opacity: 0, x: offset, scale: 0.985 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -offset * 0.6, scale: 0.99 }}
            transition={{
              // Position springs for a natural settle; opacity leads slightly
              // so the incoming screen is readable before it stops moving.
              x: { type: "spring", stiffness: 460, damping: 40, mass: 0.6 },
              scale: { type: "spring", stiffness: 420, damping: 36, mass: 0.6 },
              opacity: { duration: 0.16, ease: "easeOut" },
            }}
            className="flex w-full flex-1 flex-col"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

/** Returns "forward" or "back" based on the depth delta of the last change. */
function useNavigationDirection(screen: Screen): "forward" | "back" {
  const previous = React.useRef<Screen>(screen);
  const direction = React.useRef<"forward" | "back">("forward");

  if (previous.current !== screen) {
    const from = DEPTH[previous.current] ?? 0;
    const to = DEPTH[screen] ?? 0;
    direction.current = to < from ? "back" : "forward";
    previous.current = screen;
  }

  return direction.current;
}

function renderScreen(screen: Screen): React.ReactNode {
  switch (screen) {
    case "landing":
      return <LandingScreen />;
    case "auth":
      return <AuthScreen />;
    case "reset-password":
      return <ResetPasswordScreen />;
    case "email-verification-gate":
      return <EmailVerificationGate />;
    case "paywall":
      return <PaywallScreen />;
    case "checkout":
      return <CheckoutScreen />;
    case "home":
      return <HomeScreen />;
    case "capture":
      return <CaptureScreen />;
    case "analyzing":
      return <AnalyzingScreen />;
    case "results":
      return <ResultsScreen />;
    case "result-detail":
      return <ResultDetailScreen />;
    case "history":
      return <HistoryScreen />;
    case "search":
      return <SearchScreen />;
    case "browse":
      return <BrowseScreen />;
    case "settings":
      return <SettingsScreen />;
    case "legal-disclaimer":
    case "legal-terms":
    case "legal-privacy": {
      const kind = legalKindFor(screen);
      if (!kind) return <HomeScreen />;
      return <LegalScreen kind={kind} />;
    }
    default:
      return <HomeScreen />;
  }
}
