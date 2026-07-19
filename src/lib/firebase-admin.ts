/**
 * Firebase Admin SDK — server-side only.
 */

import type { Auth } from "firebase-admin/auth";

let _adminAuth: Auth | null = null;
let _initAttempted = false;

/**
 * Parse the FIREBASE_SERVICE_ACCOUNT env var.
 */
function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;

  // Attempt 1: Direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key && parsed.client_email) return parsed;
  } catch { /* continue */ }

  // Attempt 2: Unescape common encoding issues
  try {
    const cleaned = raw
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"');
    const parsed = JSON.parse(cleaned);
    if (parsed.private_key && parsed.client_email) return parsed;
  } catch { /* continue */ }

  // Attempt 3: Base64 encoded
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed.private_key && parsed.client_email) return parsed;
  } catch { /* continue */ }

  console.warn("[firebase-admin] FIREBASE_SERVICE_ACCOUNT is set but could not be parsed as valid JSON.");
  return null;
}

/**
 * Ensure the private_key field has actual newline characters, not literal \n.
 */
function fixPrivateKey(obj: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...obj };
  if (typeof copy.private_key === "string") {
    copy.private_key = (copy.private_key as string).replace(/\\n/g, "\n");
  }
  return copy;
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

export async function getAdminAuth(): Promise<Auth | null> {
  if (_adminAuth) return _adminAuth;
  if (_initAttempted) return null;
  _initAttempted = true;

  try {
    const { initializeApp, getApps, cert, applicationDefault } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    const rawAccount = parseServiceAccount();
    const apps = getApps();
    if (apps.length === 0) {
      if (rawAccount) {
        const serviceAccount = fixPrivateKey(rawAccount);
        const app = initializeApp({
          credential: cert(serviceAccount as any),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medsnap-8057d",
        });
        _adminAuth = getAuth(app);
        console.log("[firebase-admin] Initialized with FIREBASE_SERVICE_ACCOUNT");
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        const app = initializeApp({
          credential: applicationDefault(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "medsnap-8057d",
        });
        _adminAuth = getAuth(app);
        console.log("[firebase-admin] Initialized with GOOGLE_APPLICATION_CREDENTIALS");
      } else {
        console.warn("[firebase-admin] No service account configured. Set FIREBASE_SERVICE_ACCOUNT env var.");
        return null;
      }
    } else {
      _adminAuth = getAuth(apps[0]);
    }
    return _adminAuth;
  } catch (err) {
    console.error("[firebase-admin] init failed:", err);
    return null;
  }
}
