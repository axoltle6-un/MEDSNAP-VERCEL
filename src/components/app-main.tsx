"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useAuthBridge } from "@/lib/use-auth-bridge";
import { useStripeSuccess } from "@/lib/use-stripe-success";
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

export function AppMain() {
  const screen = useAppStore((s) => s.screen);
  const { user, loading } = useAuth();

  // Bridge Firebase Auth to Zustand store
  useAuthBridge();

  // Automatic listener for returning Stripe Checkout success redirects
  useStripeSuccess();

  let effectiveScreen: Screen = screen;

  const isGoogleUser = user?.providerData?.some(
    (p) => p.providerId === "google.com"
  );

  // Routing logic: Unauthenticated users on public screens see that screen (e.g. landing), otherwise landing
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

  if (loading) {
    return <LoadingSplash message="Loading MedSnap AI App…" />;
  }

  const isFullscreen = FULLSCREEN_SCREENS.includes(effectiveScreen);
  const content = renderScreen(effectiveScreen);

  if (isFullscreen) {
    return (
      <motion.div
        key={effectiveScreen}
        initial={{ opacity: 0, scale: 0.995 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-[100dvh] w-full"
      >
        {content}
      </motion.div>
    );
  }

  return (
    <AppShell>
      <motion.div
        key={effectiveScreen}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col w-full"
      >
        {content}
      </motion.div>
    </AppShell>
  );
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
