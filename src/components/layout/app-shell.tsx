"use client";

import * as React from "react";
import { TabBar } from "@/components/layout/tab-bar";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { useAppStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

const FULLSCREEN: Screen[] = ["auth", "reset-password", "email-verification-gate", "landing", "onboarding", "paywall", "analyzing"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const screen = useAppStore((s) => s.screen);
  const isFullscreen = FULLSCREEN.includes(screen);
  if (isFullscreen) return <>{children}</>;
  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-calm-gradient">
      <DisclaimerBanner />
      <TabBar />
      <main className="relative z-10 mx-auto w-full flex-1 px-4 pb-28 pt-4 md:px-8 md:pb-12 md:pt-8 md:max-w-5xl">
        {children}
      </main>
    </div>
  );
}
