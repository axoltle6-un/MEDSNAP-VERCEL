"use client";

import * as React from "react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isFirebaseEnabled: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  userVersion: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  // Version counter — incremented on every refreshUser() call to force
  // all consumers of useAuth() to re-render and re-read user.emailVerified.
  // This is necessary because Firebase's onAuthStateChanged does NOT fire
  // when emailVerified changes, and spreading the User object doesn't
  // reliably capture getter properties like emailVerified.
  const [userVersion, setUserVersion] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;

    // Dynamic import — only loads Firebase if configured
    (async () => {
      try {
        const { ensureFirebaseReady, getAuthInstance } = await import("@/lib/firebase");
        await ensureFirebaseReady();
        if (cancelled) return;
        const auth = getAuthInstance();
        if (!auth) {
          setLoading(false);
          return;
        }
        const { onAuthStateChanged } = await import("firebase/auth");
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u);
          setLoading(false);
        });
      } catch (err) {
        console.error("Firebase init failed:", err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    const { ensureFirebaseReady, getAuthInstance } = await import("@/lib/firebase");
    await ensureFirebaseReady();
    const auth = getAuthInstance();
    if (!auth) throw new Error("Firebase not configured");
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  const signIn = async (email: string, password: string) => {
    const { ensureFirebaseReady, getAuthInstance } = await import("@/lib/firebase");
    await ensureFirebaseReady();
    const auth = getAuthInstance();
    if (!auth) throw new Error("Firebase not configured");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const { ensureFirebaseReady, getAuthInstance } = await import("@/lib/firebase");
    await ensureFirebaseReady();
    const auth = getAuthInstance();
    if (!auth) throw new Error("Firebase not configured");
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    const { ensureFirebaseReady, getAuthInstance } = await import("@/lib/firebase");
    await ensureFirebaseReady();
    const auth = getAuthInstance();
    if (!auth) throw new Error("Firebase not configured");
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  };

  /**
   * Force-refresh the current user's state from Firebase.
   * This is critical after email verification: onAuthStateChanged does NOT
   * fire when emailVerified changes, so we need to manually reload the user
   * and force all consumers to re-render.
   *
   * Uses a version counter because Firebase User objects use getters (not
   * plain properties), so spreading { ...user } doesn't reliably capture
   * emailVerified. The version counter forces AuthProvider to re-render,
   * which creates a new context value object, which triggers re-renders in
   * all useAuth() consumers — and they read user.emailVerified fresh.
   */
  const refreshUser = useCallback(async () => {
    const { getAuthInstance } = await import("@/lib/firebase");
    const auth = getAuthInstance();
    if (!auth?.currentUser) return;

    // Reload the user from Firebase (picks up emailVerified change)
    await auth.currentUser.reload();
    // Force a token refresh — this also ensures the ID token has the updated
    // emailVerified claim
    await auth.currentUser.getIdToken(true);
    // Increment version to force all consumers to re-render
    setUserVersion((v) => v + 1);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFirebaseEnabled: isFirebaseConfigured,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
        refreshUser,
        // userVersion is included to force re-renders when refreshUser is called.
        // Without this, consumers wouldn't know to re-read user.emailVerified.
        userVersion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
