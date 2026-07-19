import { getAuthInstance, ensureFirebaseReady } from "@/lib/firebase";

export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safe fetch helper for API calls with automatic Bearer Token Injection.
 *
 * Features:
 *  - Automatically attaches the current user's Firebase Auth ID token (`Authorization: Bearer <token>`).
 *  - Ensures responses are parsed safely as JSON (avoids "Unexpected token '<'" on HTML error pages).
 *  - Gracefully handles network errors, timeouts, and platform restarts.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const headers = new Headers(options?.headers || {});

    // Auto-inject Firebase User ID Token if logged in
    try {
      await ensureFirebaseReady();
      const auth = getAuthInstance();
      if (auth?.currentUser) {
        const idToken = await auth.currentUser.getIdToken();
        if (idToken && !headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${idToken}`);
        }
      }
    } catch {
      // Non-fatal if token retrieval fails
    }

    const mergedOptions: RequestInit = {
      ...options,
      headers,
    };

    const res = await fetch(url, mergedOptions);

    // Check content-type before trying to parse
    const contentType = res.headers.get("content-type") || "";

    if (!contentType.includes("application/json")) {
      const text = await res.text().catch(() => "");
      console.error(`[safeFetch] ${url} returned non-JSON (${res.status}):`, text.slice(0, 200));

      let errorMsg: string;
      if (res.status === 0 || res.status === 502 || res.status === 503) {
        errorMsg = "Server is starting up or inactive. Please wait a moment and try again.";
      } else if (res.status === 413) {
        errorMsg = "Request too large. Try a smaller image or fewer characters.";
      } else if (res.status === 429) {
        errorMsg = "Too many requests. Please wait a minute and try again.";
      } else if (res.status === 500) {
        errorMsg = "Server error. Please try again in a moment.";
      } else if (res.status === 404) {
        errorMsg = "Service not found. The server may be restarting.";
      } else {
        errorMsg = `Server returned ${res.status}. Please try again.`;
      }

      return {
        ok: false,
        status: res.status,
        data: null,
        error: errorMsg,
      };
    }

    const json = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: json?.error || `Request failed (${res.status})`,
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json as T,
      error: null,
    };
  } catch (err) {
    console.error(`[safeFetch] ${url} fetch failed:`, err);
    const msg = err instanceof Error ? err.message : "Network error";

    if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: "Cannot reach the server. Please check your connection and try again.",
      };
    }

    return {
      ok: false,
      status: 0,
      data: null,
      error: msg,
    };
  }
}
