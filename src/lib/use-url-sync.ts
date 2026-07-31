"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import {
  pathForScreen,
  screenForPath,
  restoreTargetFor,
} from "@/lib/screen-routes";
import type { Screen } from "@/lib/types";

/**
 * Keeps the address bar in sync with the screen actually on display.
 *
 * Three jobs:
 *   1. On first load, adopt the screen implied by the URL, so /capture opens
 *      the capture tab rather than always landing on home.
 *   2. On every screen change, replace the path so links are shareable and
 *      bookmarkable.
 *   3. Handle browser Back/Forward — previously Back left the app entirely,
 *      which on a PWA-style app feels like a crash.
 *
 * IMPORTANT: callers must pass the *effective* screen — the one being
 * rendered after auth gating — not the raw store value. A logged-out user
 * clicking through is redirected to "landing", so syncing the raw store
 * screen would show /capture in the address bar while the landing page is on
 * screen. The URL must describe what the user is actually looking at.
 *
 * The Zustand store stays the source of truth; the URL is a mirror. That
 * avoids rewriting 19 screens as Next.js routes while still giving real URLs.
 */
export function useUrlSync(effectiveScreen?: Screen) {
  const storeScreen = useAppStore((s) => s.screen);
  const screen = effectiveScreen ?? storeScreen;
  const hydratedRef = React.useRef(false);
  // Set while we're applying a popstate, so the sync effect doesn't push a
  // duplicate entry and fight the browser's own history.
  const applyingPopRef = React.useRef(false);

  // --- 1. Adopt the URL on first mount -------------------------------------
  React.useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof window === "undefined") return;

    const fromUrl = screenForPath(window.location.pathname);
    if (!fromUrl) return;

    // Transient screens (analyzing/results) have no data after a refresh —
    // send the user somewhere coherent instead of an empty report.
    const target = restoreTargetFor(fromUrl);

    if (target !== useAppStore.getState().screen) {
      // Set directly rather than navigate(): this is a restore, not a
      // forward navigation, so it shouldn't push onto the in-app history.
      useAppStore.setState({ screen: target, screenParams: {} });
    }

    // Correct the address bar if we redirected away from a transient screen.
    if (target !== fromUrl) {
      window.history.replaceState({ screen: target }, "", pathForScreen(target));
    }
  }, []);

  // --- 2. Mirror screen changes into the URL -------------------------------
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (applyingPopRef.current) {
      applyingPopRef.current = false;
      return;
    }

    const path = pathForScreen(screen);
    if (normalisePath(window.location.pathname) === normalisePath(path)) return;

    // pushState, so each screen becomes a real browser history entry.
    //
    // This previously used replaceState, on the mistaken reasoning that the
    // store's own history made a second entry redundant. It does not:
    // replacing OVERWRITES the current entry, so navigating
    // dashboard -> browse left a single-entry stack and the browser Back
    // button had nowhere to go — it exited the app entirely.
    //
    // Pushing gives Back the behaviour users expect (browse -> dashboard).
    // The popstate handler below turns that into a store update, and the
    // applyingPopRef guard stops it pushing a duplicate on the way back.
    window.history.pushState({ screen }, "", path);
  }, [screen]);

  // --- 3. Browser Back / Forward -------------------------------------------
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    function onPop(e: PopStateEvent) {
      const stateScreen = (e.state as { screen?: Screen } | null)?.screen;
      const fromUrl = stateScreen || screenForPath(window.location.pathname);
      if (!fromUrl) return;

      const target = restoreTargetFor(fromUrl as Screen);
      applyingPopRef.current = true;
      useAppStore.setState({ screen: target, screenParams: {} });
    }

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
}

function normalisePath(p: string): string {
  if (!p || p === "/") return "/";
  return p.replace(/\/+$/, "") || "/";
}
