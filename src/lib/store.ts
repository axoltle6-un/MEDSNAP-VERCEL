"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  AppSettings,
  MedicineResult,
  ScanRecord,
  Screen,
  UserProfile,
  ReportFeedback,
} from "@/lib/types";
import { MEDICINE_DB, searchMedicines } from "@/lib/medicine-db";
import {
  uploadScan,
  deleteScanFromCloud,
  fetchAllScans,
  saveUserDoc,
  fetchUserDoc,
  isCloudSyncEnabled,
  subscribeToScans,
  type UserDoc,
} from "@/lib/firestore-service";

interface AppState {
  // Navigation
  screen: Screen;
  screenParams: Record<string, unknown>;
  navigate: (screen: Screen, params?: Record<string, unknown>) => void;
  goBack: () => void;
  history: { screen: Screen; params: Record<string, unknown> }[];

  // Onboarding
  onboardingComplete: boolean;
  profile: UserProfile;
  setProfile: (p: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;

  // Settings
  settings: AppSettings;
  setSettings: (s: Partial<AppSettings>) => void;

  // Theme preference
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;

  // Scan workflow
  pendingPhotos: string[];
  setPendingPhotos: (p: string[]) => void;
  currentResult: MedicineResult | null;
  currentScanId: string | null;
  setCurrentResult: (r: MedicineResult | null, scanId?: string | null) => void;

  // History
  scans: ScanRecord[];
  addScan: (s: ScanRecord) => void;
  deleteScan: (id: string) => void;
  clearHistory: () => void;
  getScan: (id: string) => ScanRecord | undefined;
  setScans: (scans: ScanRecord[]) => void; // used by cloud sync
  toggleFavorite: (id: string) => void;
  toggleTag: (id: string, tag: string) => void;
  restoreScan: (s: ScanRecord) => void;

  // Cloud sync (Firebase)
  cloudUserId: string | null;
  setCloudUserId: (uid: string | null) => void;
  syncFromCloud: (uid: string) => Promise<void>;
  unsubscribeCloud: (() => void) | null;
  clearUserData: () => void;

  // Active detail target
  activeDetailSection:
    | "uses"
    | "common-side-effects"
    | "serious-side-effects"
    | "interactions"
    | "who-should-avoid"
    | "storage"
    | "sources"
    | null;
  setActiveDetailSection: (s: AppState["activeDetailSection"]) => void;

  // Disclaimer acceptance
  disclaimerAcknowledged: boolean;
  acknowledgeDisclaimer: () => void;

  // Cookie consent
  cookieConsent: "accepted" | "rejected" | null;
  setCookieConsent: (consent: "accepted" | "rejected") => void;

  // Pro subscription
  isPro: boolean;
  setPro: (val: boolean) => void;
  proPlan: "monthly" | "yearly" | null;
  setProPlan: (plan: "monthly" | "yearly") => void;
  proSince: number | null;
  activatePro: (plan: "monthly" | "yearly") => void;
  deactivatePro: () => void;

  // Daily scan limits
  scansToday: number;
  lastScanDate: string | null;
  canScan: () => boolean;
  recordScan: () => void;
  scansRemaining: () => number;

  // Report feedback
  reports: ReportFeedback[];
  submitReport: (r: ReportFeedback) => void;
}

const DEFAULT_PROFILE: UserProfile = {
  role: null,
  takesMedicationRegularly: null,
  allergies: [],
  conditions: [],
};

const DEFAULT_SETTINGS: AppSettings = {
  units: "metric",
  showDisclaimerOnScan: true,
  highContrastWarnings: false,
};

function seedScans(): ScanRecord[] {
  const now = Date.now();
  const picks = [MEDICINE_DB[1], MEDICINE_DB[0], MEDICINE_DB[4]];
  return picks.map((m, i) => ({
    id: `seed-${m.id}-${i}`,
    createdAt: now - (i + 1) * 1000 * 60 * 60 * 9,
    medicine: m,
    photos: [],
    source: i === 1 ? "search" : "camera",
    notes: i === 0 ? "Morning vitamins" : undefined,
  }));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: "landing",
      screenParams: {},
      history: [],

      navigate: (screen, params = {}) => {
        const { screen: prev, screenParams: prevParams, history } = get();
        const newHistory = [...history, { screen: prev, params: prevParams }];
        if (newHistory.length > 20) newHistory.shift();
        set({ screen, screenParams: params, history: newHistory });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      },

      goBack: () => {
        const { history } = get();
        if (history.length === 0) {
          set({ screen: "home", screenParams: {} });
          return;
        }
        const last = history[history.length - 1];
        set({
          screen: last.screen,
          screenParams: last.params,
          history: history.slice(0, -1),
        });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      },

      onboardingComplete: true,
      profile: DEFAULT_PROFILE,
      setProfile: (p) => {
        set({ profile: { ...get().profile, ...p } });
        const { cloudUserId } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            profile: { ...get().profile, ...p },
            onboardingComplete: true,
            settings: get().settings,
          }).catch(console.error);
        }
      },
      completeOnboarding: () => {
        set({ onboardingComplete: true, screen: "home" });
        const { cloudUserId, profile, settings } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            profile,
            onboardingComplete: true,
            settings,
          }).catch(console.error);
        }
      },
      resetOnboarding: () =>
        set({
          onboardingComplete: true,
          profile: DEFAULT_PROFILE,
          screen: "settings",
          history: [],
        }),

      settings: DEFAULT_SETTINGS,
      setSettings: (s) => {
        set({ settings: { ...get().settings, ...s } });
        const { cloudUserId } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            settings: get().settings,
            profile: get().profile,
            onboardingComplete: get().onboardingComplete,
          }).catch(console.error);
        }
      },

      theme: "system",
      setTheme: (t) => set({ theme: t }),

      pendingPhotos: [],
      setPendingPhotos: (p) => set({ pendingPhotos: p }),
      currentResult: null,
      currentScanId: null,
      setCurrentResult: (r, scanId = null) =>
        set({ currentResult: r, currentScanId: scanId }),

      scans: [], // Starts empty, populated from account cloud storage
      addScan: (s) => {
        set({ scans: [s, ...get().scans].slice(0, 200) });
        const { cloudUserId } = get();
        if (cloudUserId) {
          uploadScan(cloudUserId, s).catch(console.error);
        }
      },
      deleteScan: (id) => {
        set({ scans: get().scans.filter((s) => s.id !== id) });
        const { cloudUserId } = get();
        if (cloudUserId) {
          deleteScanFromCloud(cloudUserId, id).catch(console.error);
        }
      },
      clearHistory: () => {
        const { scans, cloudUserId } = get();
        set({ scans: [] });
        if (cloudUserId) {
          // Delete each from cloud
          for (const s of scans) {
            deleteScanFromCloud(cloudUserId, s.id).catch(console.error);
          }
        }
      },
      getScan: (id) => get().scans.find((s) => s.id === id),
      setScans: (scans) => set({ scans }),
      toggleFavorite: (id) => {
        const scans = get().scans.map((s) =>
          s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
        );
        set({ scans });
      },
      toggleTag: (id, tag) => {
        const scans = get().scans.map((s) => {
          if (s.id !== id) return s;
          const currentTags = s.tags || [];
          const newTags = currentTags.includes(tag)
            ? currentTags.filter((t) => t !== tag)
            : [...currentTags, tag];
          return { ...s, tags: newTags };
        });
        set({ scans });
      },
      restoreScan: (s) => {
        const scans = [s, ...get().scans.filter((x) => x.id !== s.id)];
        set({ scans });
        const { cloudUserId } = get();
        if (cloudUserId) {
          uploadScan(cloudUserId, s).catch(console.error);
        }
      },

      // ---------- Cloud sync ----------
      cloudUserId: null,
      unsubscribeCloud: null,
      setCloudUserId: (uid) => set({ cloudUserId: uid }),

      /**
       * Wipe ALL user-specific data from the local store.
       * Called on sign-out and before loading a new user's data.
       * This prevents data leaking between accounts.
       */
      clearUserData: () => {
        const { unsubscribeCloud } = get();
        if (unsubscribeCloud) {
          unsubscribeCloud();
        }
        set({
          scans: [],
          profile: DEFAULT_PROFILE,
          settings: DEFAULT_SETTINGS,
          onboardingComplete: true,
          currentResult: null,
          currentScanId: null,
          pendingPhotos: [],
          cloudUserId: null,
          unsubscribeCloud: null,
          reports: [],
          activeDetailSection: null,
          // Reset navigation directly to landing screen for website
          screen: "landing",
          screenParams: {},
          history: [],
        });
      },

      syncFromCloud: async (uid) => {
        // Unsubscribe any existing subscription
        const { unsubscribeCloud } = get();
        if (unsubscribeCloud) {
          unsubscribeCloud();
          set({ unsubscribeCloud: null });
        }

        if (!isCloudSyncEnabled()) return;

        try {
          // 1. CLEAR all local data first — start fresh for this user.
          // This prevents the previous user's scans from leaking into the new
          // user's view or getting uploaded to their cloud account.
          set({
            scans: [],
            currentResult: null,
            currentScanId: null,
            pendingPhotos: [],
          });

          // 2. Fetch user doc (profile + settings + onboardingComplete)
          const userDoc = await fetchUserDoc(uid);
          if (userDoc) {
            const updates: Partial<AppState> = {};
            if (userDoc.profile) updates.profile = userDoc.profile;
            if (userDoc.settings) updates.settings = userDoc.settings;
            if (typeof userDoc.onboardingComplete === "boolean") {
              updates.onboardingComplete = userDoc.onboardingComplete;
            }
            set(updates as Partial<AppState>);
          }

          // 3. Fetch scans — REPLACE local scans (don't merge).
          // The previous user's scans were already cleared above, so there's
          // nothing to merge. We just set the new user's cloud scans directly.
          const scans = await fetchAllScans(uid);
          set({ scans });

          // 4. Subscribe to live scan updates — REPLACE (don't merge)
          const unsub = subscribeToScans(uid, (cloudScans) => {
            set({ scans: cloudScans });
          });
          set({ unsubscribeCloud: unsub });
        } catch (err) {
          console.error("[syncFromCloud] failed:", err);
        }
      },

      activeDetailSection: null,
      setActiveDetailSection: (s) => set({ activeDetailSection: s }),

      disclaimerAcknowledged: false,
      acknowledgeDisclaimer: () => set({ disclaimerAcknowledged: true }),

      cookieConsent: null,
      setCookieConsent: (consent) => set({ cookieConsent: consent }),

      // ---------- Pro subscription ----------
      isPro: false,
      proPlan: null,
      proSince: null,
      setPro: (val) => {
        set({ isPro: val });
        const { cloudUserId } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            profile: get().profile,
            settings: get().settings,
            onboardingComplete: get().onboardingComplete,
            isPro: val,
            proPlan: get().proPlan,
            proSince: get().proSince,
          } as any).catch(console.error);
        }
      },
      setProPlan: (plan) => set({ proPlan: plan }),
      activatePro: (plan) => {
        const now = Date.now();
        // Reset daily scan counter to 0 upon purchasing or renewing a subscription
        set({ isPro: true, proPlan: plan, proSince: now, scansToday: 0 });
        const { cloudUserId } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            profile: get().profile,
            settings: get().settings,
            onboardingComplete: get().onboardingComplete,
            isPro: true,
            proPlan: plan,
            proSince: now,
            scansToday: 0,
          } as any).catch(console.error);
        }
      },
      deactivatePro: () => {
        set({ isPro: false, proPlan: null, proSince: null });
        const { cloudUserId } = get();
        if (cloudUserId) {
          saveUserDoc(cloudUserId, {
            profile: get().profile,
            settings: get().settings,
            onboardingComplete: get().onboardingComplete,
            isPro: false,
            proPlan: null,
            proSince: null,
          } as any).catch(console.error);
        }
      },

      // ---------- Daily scan limits ----------
      scansToday: 0,
      lastScanDate: null,
      canScan: () => {
        const { isPro, scansToday, lastScanDate } = get();
        const today = new Date().toDateString();
        // Reset counter if it's a new day
        if (lastScanDate !== today) {
          return true;
        }
        const limit = isPro ? 4 : 1;
        return scansToday < limit;
      },
      recordScan: () => {
        const today = new Date().toDateString();
        const { lastScanDate, scansToday } = get();
        // Reset counter if it's a new day
        if (lastScanDate !== today) {
          set({ scansToday: 1, lastScanDate: today });
        } else {
          set({ scansToday: scansToday + 1, lastScanDate: today });
        }
      },
      scansRemaining: () => {
        const { isPro, scansToday, lastScanDate } = get();
        const today = new Date().toDateString();
        // Reset counter if it's a new day
        if (lastScanDate !== today) {
          return isPro ? 4 : 1;
        }
        const limit = isPro ? 4 : 1;
        return Math.max(0, limit - scansToday);
      },

      reports: [],
      submitReport: (r) => set({ reports: [r, ...get().reports].slice(0, 100) }),
    }),
    {
      name: "medsnap-store-v3",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        profile: state.profile,
        settings: state.settings,
        theme: state.theme,
        scans: state.scans,
        disclaimerAcknowledged: state.disclaimerAcknowledged,
        cookieConsent: state.cookieConsent,
        isPro: state.isPro,
        proPlan: state.proPlan,
        proSince: state.proSince,
        scansToday: state.scansToday,
        lastScanDate: state.lastScanDate,
        reports: state.reports,
      }),
    }
  )
);

export function buildScanRecord(
  medicine: MedicineResult,
  photos: string[],
  source: ScanRecord["source"],
  query?: string
): ScanRecord {
  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    medicine,
    photos,
    source,
    query: query || "",
  };
}

export { searchMedicines, MEDICINE_DB };
