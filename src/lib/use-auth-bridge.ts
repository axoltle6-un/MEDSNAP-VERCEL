"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { useAppStore } from "@/lib/store";

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
          if (screen === "auth") {
            navigate("home");
          }
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
