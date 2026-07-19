import {
  isFirebaseConfigured,
  ensureFirebaseReady,
  getDbInstance,
} from "@/lib/firebase";
import type { ScanRecord, UserProfile, AppSettings } from "@/lib/types";

/**
 * Firestore data layer — all imports are dynamic to keep Firebase out of
 * the main bundle when not configured.
 */

export function isCloudSyncEnabled(): boolean {
  return isFirebaseConfigured && Boolean(getDbInstance());
}

async function ready() {
  await ensureFirebaseReady();
  return getDbInstance();
}

// ---------- Scans ----------

export async function uploadScan(uid: string, scan: ScanRecord): Promise<void> {
  const db = await ready();
  if (!db) return;
  const { collection, doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  // Strip photos (too large for Firestore) and deep-remove all undefined fields
  const { photos, ...rest } = scan;
  const clean = deepRemoveUndefined(rest);
  await setDoc(doc(collection(db, "users", uid, "scans"), clean.id as string), {
    ...clean,
    uploadedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Recursively remove all undefined values from an object.
 * Firestore rejects undefined field values.
 */
function deepRemoveUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (value === null) {
      clean[key] = null;
      continue;
    }
    if (Array.isArray(value)) {
      clean[key] = value.map((v) =>
        typeof v === "object" && v !== null && !Array.isArray(v)
          ? deepRemoveUndefined(v as Record<string, unknown>)
          : v === undefined ? "" : v
      ).filter((v) => v !== undefined);
      continue;
    }
    if (typeof value === "object") {
      clean[key] = deepRemoveUndefined(value as Record<string, unknown>);
      continue;
    }
    clean[key] = value;
  }
  return clean;
}

export async function deleteScanFromCloud(uid: string, scanId: string): Promise<void> {
  const db = await ready();
  if (!db) return;
  const { collection, doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(collection(db, "users", uid, "scans"), scanId));
}

export async function fetchAllScans(uid: string): Promise<ScanRecord[]> {
  const db = await ready();
  if (!db) return [];
  const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
  const q = query(collection(db, "users", uid, "scans"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as Omit<ScanRecord, "id" | "photos">;
    return {
      id: d.id,
      photos: [],
      ...data,
      createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
    } as ScanRecord;
  });
}

export function subscribeToScans(
  uid: string,
  callback: (scans: ScanRecord[]) => void
): () => void {
  let unsub: (() => void) | undefined;
  let cancelled = false;
  ready().then(async (db) => {
    if (cancelled || !db) return;
    const { collection, query, orderBy, onSnapshot } = await import("firebase/firestore");
    const q = query(collection(db, "users", uid, "scans"), orderBy("createdAt", "desc"));
    unsub = onSnapshot(q, (snap) => {
      const scans = snap.docs.map((d) => {
        const data = d.data() as Omit<ScanRecord, "id" | "photos">;
        return {
          id: d.id,
          photos: [],
          ...data,
          createdAt: typeof data.createdAt === "number" ? data.createdAt : Date.now(),
        } as ScanRecord;
      });
      callback(scans);
    });
  });
  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

// ---------- Profile + preferences ----------
// NOTE: Firestore document paths must have EVEN number of segments.
// "users/{uid}" = 2 segments (even) = valid document reference.
// "users/{uid}/profile" = 3 segments (odd) = INVALID (would be a collection).

export interface UserDoc {
  profile: UserProfile;
  settings: AppSettings;
  onboardingComplete: boolean;
}

export async function saveUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  const db = await ready();
  if (!db) return;
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  // Use "users/{uid}" (2 segments = even = valid document)
  // Deep-remove undefined fields before sending to Firestore
  const clean = deepRemoveUndefined(data as Record<string, unknown>);
  await setDoc(doc(db, "users", uid), {
    ...clean,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function fetchUserDoc(uid: string): Promise<UserDoc | null> {
  const db = await ready();
  if (!db) return null;
  const { doc, getDoc } = await import("firebase/firestore");
  // Use "users/{uid}" (2 segments = even = valid document)
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserDoc;
}
