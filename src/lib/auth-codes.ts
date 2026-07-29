/**
 * Cryptographically Secure Auth Code Store with SHA-256 Hashing & Constant-Time Verification.
 *
 * Security Features:
 *  - Cryptographically secure 6-digit token generation via Node's `crypto` module.
 *  - Plaintext tokens are NEVER stored — only SHA-256 hashes are retained.
 *  - Verification uses `crypto.timingSafeEqual` to prevent timing attacks.
 *  - 10-minute TTL per token.
 *  - Maximum 5 attempts before immediate token revocation (brute-force protection).
 *
 * STORAGE
 * -------
 * Codes previously lived in a module-level `new Map()`. On Vercel each
 * serverless instance has its own memory, so a code issued by instance A
 * could not be verified by instance B — signup and password reset failed
 * intermittently with "Invalid or expired code" for legitimate users.
 *
 * They now live in the shared store (Firestore via firebase-admin, with an
 * in-memory fallback for local dev), so any instance can verify a code issued
 * by any other. All functions are async as a result.
 */

import crypto from "crypto";
import { put, get, del } from "@/lib/shared-store";

interface HashEntry {
  hashedCode: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

/** Key format: `authcode:${purpose}:${emailLowercase}` */
function keyFor(purpose: "verify-email" | "reset-password", email: string): string {
  return `authcode:${purpose}:${email.toLowerCase().trim()}`;
}

/**
 * Hash a plaintext token using SHA-256.
 */
function hashToken(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

/**
 * Generate a cryptographically secure 6-digit code.
 */
export function generateCode(): string {
  const val = crypto.randomInt(100000, 1000000);
  return val.toString();
}

/**
 * Store a new code for an email + purpose.
 * Stores ONLY the SHA-256 hash of the code.
 */
export async function storeCode(
  purpose: "verify-email" | "reset-password",
  email: string
): Promise<string> {
  const code = generateCode();
  const entry: HashEntry = {
    hashedCode: hashToken(code),
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
  };
  await put(keyFor(purpose, email), entry, TTL_MS);
  return code;
}

/**
 * Verify a code in constant time using timingSafeEqual on SHA-256 hashes.
 */
export async function verifyCode(
  purpose: "verify-email" | "reset-password",
  email: string,
  submittedCode: string
): Promise<{ valid: boolean; error?: string }> {
  const key = keyFor(purpose, email);
  const entry = await get<HashEntry>(key);

  if (!entry) {
    return { valid: false, error: "No code found or code expired. Please request a new one." };
  }

  if (entry.expiresAt < Date.now()) {
    await del(key);
    return { valid: false, error: "Code expired. Please request a new code." };
  }

  if (entry.attempts >= entry.maxAttempts) {
    await del(key);
    return { valid: false, error: "Too many failed attempts. Code revoked. Please request a new one." };
  }

  const submittedHash = hashToken(submittedCode);
  const bufA = Buffer.from(entry.hashedCode, "hex");
  const bufB = Buffer.from(submittedHash, "hex");

  // Constant-time hash comparison
  let isMatch = false;
  if (bufA.length === bufB.length) {
    isMatch = crypto.timingSafeEqual(bufA, bufB);
  }

  if (!isMatch) {
    const attempts = entry.attempts + 1;
    const remaining = entry.maxAttempts - attempts;

    if (remaining <= 0) {
      await del(key);
      return { valid: false, error: "Too many failed attempts. Code revoked. Request a new code." };
    }

    // Persist the incremented attempt count, preserving the original expiry.
    await put(key, { ...entry, attempts }, Math.max(1, entry.expiresAt - Date.now()));

    return {
      valid: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Success — invalidate immediately to prevent replay attacks
  await del(key);
  return { valid: true };
}

/**
 * Check if a non-expired code exists for throttling resends.
 */
export async function hasCode(
  purpose: "verify-email" | "reset-password",
  email: string
): Promise<boolean> {
  const entry = await get<HashEntry>(keyFor(purpose, email));
  return Boolean(entry && entry.expiresAt > Date.now());
}
