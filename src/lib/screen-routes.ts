"use client";

/**
 * Screen <-> URL mapping.
 *
 * MedSnap is a single-page state machine: `useAppStore.screen` decides what
 * renders, and the address bar never changed — every tab sat at "/". That
 * meant no shareable links, no bookmarking, and the browser Back button left
 * the app entirely instead of going back a screen.
 *
 * Rather than rewrite 19 screens into real Next.js routes (a large, risky
 * change), this keeps the state machine as the source of truth and mirrors it
 * into the URL with the History API. The app still boots from a single route,
 * so a hard refresh on /capture is handled by a rewrite in next.config.ts.
 */

import type { Screen } from "@/lib/types";

/** Canonical path for each screen. */
export const SCREEN_TO_PATH: Record<Screen, string> = {
  landing: "/",
  auth: "/login",
  "reset-password": "/reset-password",
  "email-verification-gate": "/verify-email",
  onboarding: "/welcome",
  home: "/dashboard",
  capture: "/capture",
  analyzing: "/analyzing",
  results: "/results",
  "result-detail": "/results/details",
  history: "/history",
  search: "/search",
  browse: "/browse",
  settings: "/settings",
  paywall: "/upgrade",
  checkout: "/checkout",
  "legal-disclaimer": "/legal/disclaimer",
  "legal-terms": "/legal/terms",
  "legal-privacy": "/legal/privacy",
};

/** Reverse map, built once. */
const PATH_TO_SCREEN: Record<string, Screen> = Object.entries(SCREEN_TO_PATH).reduce(
  (acc, [screen, path]) => {
    acc[path] = screen as Screen;
    return acc;
  },
  {} as Record<string, Screen>
);

/** Strip trailing slashes so "/capture/" and "/capture" behave identically. */
function normalise(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** Screen for a URL path, or null when the path isn't one of ours. */
export function screenForPath(pathname: string): Screen | null {
  return PATH_TO_SCREEN[normalise(pathname)] ?? null;
}

/** Path for a screen. Falls back to "/" for anything unmapped. */
export function pathForScreen(screen: Screen): string {
  return SCREEN_TO_PATH[screen] ?? "/";
}

/**
 * Screens that should not be linkable or restored on load.
 *
 * `analyzing` is a transient state driven by an in-flight request — landing on
 * it directly would show a progress ring for work that was never started.
 * `results` and `result-detail` render whatever is in `currentResult`, which
 * is lost on refresh, so they'd render an empty report.
 */
const NON_RESTORABLE: Screen[] = ["analyzing", "results", "result-detail"];

/** Where to send the user when they deep-link to a non-restorable screen. */
export function restoreTargetFor(screen: Screen): Screen {
  return NON_RESTORABLE.includes(screen) ? "home" : screen;
}

export function isRestorable(screen: Screen): boolean {
  return !NON_RESTORABLE.includes(screen);
}
