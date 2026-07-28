"use client";

/**
 * Cookie consent — the enforcement layer.
 *
 * Previously the consent banner only wrote a value into the Zustand store and
 * nothing ever read it: no analytics were gated, no cookie was written, and
 * "Reject" had exactly the same effect as "Accept". That is a compliance
 * problem as much as a bug — the banner claimed a choice it never honoured.
 *
 * This module:
 *   1. Persists the decision in a real first-party cookie (so it survives
 *      localStorage clears and is visible to the server if needed).
 *   2. Gates Firebase Analytics — it only ever loads after explicit consent.
 *   3. Actively disables analytics and clears its cookies on rejection or
 *      withdrawal.
 */

export type ConsentValue = "accepted" | "rejected" | null;

const CONSENT_COOKIE = "medsnap_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read the consent decision from the first-party cookie. */
export function readConsentCookie(): ConsentValue {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.split("=")[1] || "");
  return value === "accepted" || value === "rejected" ? value : null;
}

/** Persist the consent decision as a first-party cookie. */
export function writeConsentCookie(value: Exclude<ConsentValue, null>): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(value)}` +
    `; Path=/; Max-Age=${CONSENT_MAX_AGE}; SameSite=Lax${secure}`;
}

/**
 * Delete Google Analytics cookies (_ga, _gid, _ga_XXXX) on rejection.
 * Without this, analytics cookies set before a withdrawal would linger.
 */
export function clearAnalyticsCookies(): void {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  // Try both the exact host and the registrable domain (".example.com").
  const domains = [host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];

  document.cookie.split("; ").forEach((row) => {
    const name = row.split("=")[0];
    if (!name) return;
    if (name === "_ga" || name === "_gid" || name.startsWith("_ga_") || name.startsWith("_gac_")) {
      domains.forEach((d) => {
        document.cookie = `${name}=; Path=/; Domain=${d}; Max-Age=0; SameSite=Lax`;
      });
      document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
    }
  });
}

let _analyticsLoaded = false;

/**
 * Initialise Firebase Analytics — ONLY when consent has been granted.
 *
 * Safe to call repeatedly; it self-guards. Analytics is loaded dynamically so
 * that rejecting consent means the SDK is never even fetched.
 */
export async function enableAnalytics(): Promise<void> {
  if (_analyticsLoaded) return;
  if (typeof window === "undefined") return;
  if (readConsentCookie() !== "accepted") return;

  try {
    const { isFirebaseConfigured, ensureFirebaseReady, getAppInstance } = await import("@/lib/firebase");
    if (!isFirebaseConfigured) return;

    await ensureFirebaseReady();
    const app = getAppInstance();
    if (!app) return;

    const { getAnalytics, isSupported, setAnalyticsCollectionEnabled } = await import("firebase/analytics");
    if (!(await isSupported())) return;

    const analytics = getAnalytics(app);
    setAnalyticsCollectionEnabled(analytics, true);
    _analyticsLoaded = true;
    console.log("[consent] Analytics enabled (user consented)");
  } catch (err) {
    console.warn("[consent] Analytics init skipped:", err);
  }
}

/** Turn analytics collection off and remove its cookies. */
export async function disableAnalytics(): Promise<void> {
  clearAnalyticsCookies();

  if (!_analyticsLoaded) return;
  try {
    const { getAppInstance } = await import("@/lib/firebase");
    const app = getAppInstance();
    if (!app) return;
    const { getAnalytics, setAnalyticsCollectionEnabled } = await import("firebase/analytics");
    setAnalyticsCollectionEnabled(getAnalytics(app), false);
    _analyticsLoaded = false;
    console.log("[consent] Analytics disabled (consent withdrawn)");
  } catch {
    /* non-fatal */
  }
}

/** Apply a consent decision: persist it and enforce it. */
export async function applyConsent(value: Exclude<ConsentValue, null>): Promise<void> {
  writeConsentCookie(value);
  if (value === "accepted") {
    await enableAnalytics();
  } else {
    await disableAnalytics();
  }
}
