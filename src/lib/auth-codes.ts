/**
 * Cryptographically Secure Auth Code Store with SHA-256 Hashing & Constant-Time Verification.
 *
 * Security Features:
 *  - Cryptographically secure 6-digit token generation via Node's `crypto` module.
 *  - Plaintext tokens are NEVER stored in memory — only SHA-256 hashes are retained.
 *  - Verification uses `crypto.timingSafeEqual` to prevent timing attacks.
 *  - 10-minute TTL per token.
 *  - Maximum 5 attempts before immediate token revocation (brute-force protection).
 */

import crypto from "crypto";

interface HashEntry {
  hashedCode: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;

// Key format: `${purpose}:${emailLowercase}`
const store = new Map<string, HashEntry>();

/** Periodic automatic purging of expired entries */
function cleanup() {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(key);
    }
  }
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
export function storeCode(purpose: "verify-email" | "reset-password", email: string): string {
  cleanup();
  const code = generateCode();
  const hashedCode = hashToken(code);
  const key = `${purpose}:${email.toLowerCase().trim()}`;

  store.set(key, {
    hashedCode,
    expiresAt: Date.now() + TTL_MS,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
  });

  return code;
}

/**
 * Verify a code in constant time using timingSafeEqual on SHA-256 hashes.
 */
export function verifyCode(
  purpose: "verify-email" | "reset-password",
  email: string,
  submittedCode: string
): { valid: boolean; error?: string } {
  cleanup();
  const key = `${purpose}:${email.toLowerCase().trim()}`;
  const entry = store.get(key);

  if (!entry) {
    return { valid: false, error: "No code found or code expired. Please request a new one." };
  }

  if (entry.expiresAt < Date.now()) {
    store.delete(key);
    return { valid: false, error: "Code expired. Please request a new code." };
  }

  if (entry.attempts >= entry.maxAttempts) {
    store.delete(key);
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
    entry.attempts += 1;
    const remaining = entry.maxAttempts - entry.attempts;
    if (remaining <= 0) {
      store.delete(key);
      return { valid: false, error: "Too many failed attempts. Code revoked. Request a new code." };
    }
    return {
      valid: false,
      error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Success — invalidate immediately to prevent replay attacks
  store.delete(key);
  return { valid: true };
}

/**
 * Check if a non-expired code exists for throttling resends.
 */
export function hasCode(purpose: "verify-email" | "reset-password", email: string): boolean {
  cleanup();
  return store.has(`${purpose}:${email.toLowerCase().trim()}`);
}
