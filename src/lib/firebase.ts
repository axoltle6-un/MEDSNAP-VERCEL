import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

/** Clean quotes or whitespace from environment variables */
function cleanEnv(val: string | undefined): string | undefined {
  if (!val) return undefined;
  const cleaned = val.trim().replace(/^["']|["']$/g, "").trim();
  return cleaned || undefined;
}

// Fallback values for the medsnap-8057d Firebase project
const DEFAULT_API_KEY = "AIzaSyC2waGI_Iv8yyIZ0vydlWEOTOcBQd12dlg";
const DEFAULT_PROJECT_ID = "medsnap-8057d";
const DEFAULT_AUTH_DOMAIN = "medsnap-8057d.firebaseapp.com";
const DEFAULT_STORAGE_BUCKET = "medsnap-8057d.firebasestorage.app";
const DEFAULT_MESSAGING_SENDER_ID = "967878603402";
const DEFAULT_APP_ID = "1:967878603402:web:fa908de9bc02d00b947373";
const DEFAULT_MEASUREMENT_ID = "G-5JQ72DG1M1";

const apiKey = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) || DEFAULT_API_KEY;
const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || DEFAULT_PROJECT_ID;
const rawAuthDomain = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || DEFAULT_AUTH_DOMAIN;

const firebaseConfig = {
  apiKey,
  authDomain: rawAuthDomain || (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || DEFAULT_STORAGE_BUCKET,
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || DEFAULT_MESSAGING_SENDER_ID,
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) || DEFAULT_APP_ID,
  measurementId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) || DEFAULT_MEASUREMENT_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _initAttempted = false;

/** Lazy-init Firebase. Call this before using `auth` or `db`. */
export async function ensureFirebaseReady(): Promise<void> {
  if (!isFirebaseConfigured) return;
  if (_auth && _db) return;
  if (_initAttempted) return;
  _initAttempted = true;

  try {
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    if (getApps().length === 0) {
      _app = initializeApp(firebaseConfig);
    } else {
      _app = getApps()[0];
    }
    _auth = getAuth(_app);
    _db = getFirestore(_app);
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

export function getAuthInstance(): Auth | null {
  return _auth;
}

export function getDbInstance(): Firestore | null {
  return _db;
}
