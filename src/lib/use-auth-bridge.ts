"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";
import type { Screen } from "@/lib/types";
import { screenForPath, isRestorable } from "@/lib/screen-routes";

/**
 * Bridges Firebase auth state with the Zustand store.
 * Direct App Flow: Unauthenticated users are routed directly to the Auth screen.
 */
export function useAuthBridge() {
  const { user, loading } = useAuth();
  const setCloudUserId = useAppStore((s) => s.setCloudUserId);
  const syncFromCloud = useAppStore((s) => s.syncFromCloud);
  const clearUserData = useAppStore((s) => s.clearUserData);
  const screen = useAppStore((s) => s.screen);
  const navigate = useAppStore((s) => s.navigate);

  const prevUidRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (loading) return;

    if (user) {
      if (prevUidRef.current !== user.uid) {
        if (prevUidRef.current !== null) {
          clearUserData();
        }
        prevUidRef.current = user.uid;
        setCloudUserId(user.uid);
        syncFromCloud(user.uid).then(() => {
          // Send signed-in users into the app.
          //
          // This previously only fired for `screen === "auth"`, i.e. the
          // moment someone completed the login form. But `screen` is not
          // persisted, so every reload starts at "landing" — a returning
          // signed-in user opening medsnap.vercel.app was left on the
          // marketing page with no redirect, and the URL stayed "/" instead
          // of "/dashboard".
          //
          // Redirect from any pre-auth screen, not just "auth".
          const current = useAppStore.getState().screen;
          const PRE_AUTH: Screen[] = ["auth", "landing", "email-verification-gate"];
          if (!PRE_AUTH.includes(current)) return;

          // Respect a deep link. Auth resolves asynchronously, so useUrlSync
          // may already have adopted /capture from the address bar — but that
          // runs before Firebase reports a user, and app-main gates non-public
          // screens back to "landing" while signed out. Re-read the URL here
          // so opening /capture signed-in lands on capture, not dashboard.
          const fromUrl =
            typeof window !== "undefined"
              ? screenForPath(window.location.pathname)
              : null;
          const target =
            fromUrl && isRestorable(fromUrl) && !PRE_AUTH.includes(fromUrl)
              ? fromUrl
              : "home";

          navigate(target);
        });
      }
    } else {
      const PUBLIC_SCREENS = [
        "landing",
        "auth",
        "reset-password",
        "legal-disclaimer",
        "legal-terms",
        "legal-privacy",
      ];

      if (prevUidRef.current !== null) {
        prevUidRef.current = null;
        clearUserData();
        navigate("landing");
      } else if (!PUBLIC_SCREENS.includes(screen)) {
        navigate("landing");
      }
    }
  }, [user, loading, screen, setCloudUserId, syncFromCloud, navigate, clearUserData]);
}
