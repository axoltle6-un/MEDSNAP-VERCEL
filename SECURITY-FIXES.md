# Security Fixes — Bugs & Loopholes

All fixes verified against a running dev server. Attack requests below were
executed live; the "after" codes are real responses, not expectations.

---

## 🔴 P0 — Free Pro for anyone (3 separate ways)

The paywall could be bypassed through **three independent holes**, any one of
which was enough to make every paid feature free.

### 1. Forged Stripe webhook — worst of the three
`src/app/api/stripe/webhook/route.ts`

When `STRIPE_WEBHOOK_SECRET` was unset the route fell through to
`JSON.parse(rawBody)` — processing **unsigned, unauthenticated** events:

```bash
curl -X POST https://<host>/api/stripe/webhook -d '{
  "type":"checkout.session.completed",
  "data":{"object":{"customer_email":"victim@example.com",
                    "metadata":{"plan":"yearly"}}}}'
```

That granted Pro to any email, from anywhere, with no Stripe involvement.
Signature verification is now **mandatory**; the route fails closed.

`403` was never reachable either — the comment claimed "development fallback",
but `NODE_ENV` was never checked, so it applied in production too.

**After:** unsigned → `503` ✅

### 2. `demo-activate` — unauthenticated entitlement grant
`src/app/api/stripe/demo-activate/route.ts`

No auth, no rate limit, no env guard. Accepted an arbitrary `email`:

```bash
curl -X POST https://<host>/api/stripe/demo-activate \
     -d '{"email":"anyone@example.com","plan":"yearly"}'
```

Now: 404 unless `NODE_ENV !== "production"` **and** `ALLOW_DEMO_PRO=true`;
requires a Firebase ID token; identity comes from the **verified token**, not
the request body, so callers can only upgrade themselves.

No UI calls this route — it was pure attack surface. Safe to delete outright.

**After:** no auth → `404` ✅

### 3. `verify-session` — session-id replay
`src/app/api/stripe/verify-session/route.ts`

Accepted any `sessionId` and upgraded the account named **inside that session**,
with no check that the caller owned it. Session ids leak via success URLs,
browser history, and referrer headers — one real paid session could be replayed
to upgrade arbitrary accounts.

Now requires auth + asserts `session.customer_email === token.email`, and writes
against the token's `uid`.

**After:** no auth → `401` ✅

---

## 🔴 P0 — Live credentials removed from source

| Secret | Location | Status |
|---|---|---|
| Gmail app password | `src/lib/email.ts` | removed — **rotate** |
| Mistral API key | `api/ai-search/route.ts` | removed — **rotate** (was live, HTTP 200) |
| LLM7 API key | `api/ai-search/route.ts` | removed — **rotate** |
| Stripe secret ×3 | `api/stripe/*` | removed — base64-obfuscated `sk_test_` |

> Values are intentionally not reproduced here — this file is committed to the
> same public repo. Retrieve them from git history at `55b0b44` if you need to
> identify exactly which credential to revoke.

All now **environment-only**, failing closed with `503` rather than silently
using a leaked credential.

The Stripe files carried this comment:

```ts
// Base64 decoded at runtime to pass GitHub secret scanning protection
```

Base64 is encoding, not encryption. Defeating secret scanning isn't a control —
it only suppressed the alert that would have caught the leak.

**Still required:** rotate every key above. Removing them from the working tree
does **not** remove them from git history (`55b0b44`).

**Verified:** `grep` for all four secrets across `src/` → no matches ✅

---

## 🟠 P1 — `isEmailConfigured()` always returned `true`

`src/lib/email.ts` hardcoded `return true`, so callers believed mail was
deliverable even with zero configuration. The `SMTP_NOT_CONFIGURED` dev-code
path was therefore **unreachable**, and misconfigured deploys failed silently
instead of surfacing a code. Now reflects actual credential presence.

---

## 🟠 P1 — Unbounded verification-code guessing

`src/app/api/auth/verify-email/route.ts` had **no rate limiting** — the only
endpoint in `auth/` without it.

`auth-codes.ts` caps 5 attempts per code, but an attacker could request a fresh
code and keep guessing. A 6-digit code is 10^6 values; unlimited rotation makes
that brute-forceable. Added IP (20) and email (10) limits per 15 min.

---

## 🟠 P1 — SSRF hardening in `image-proxy`

`src/app/api/image-proxy/route.ts`:

- **Redirects followed by default** — an allowlisted host could `302` the proxy
  to an internal address, bypassing `isAllowedUrl()` entirely. Now `redirect: "manual"`.
- **`http://` permitted** — allowed cleartext downgrade. HTTPS only now.
- **Embedded credentials** (`https://user:pass@host`) accepted. Now rejected.

Verified live — all `403`:
`http://` downgrade · creds-in-URL · `169.254.169.254` metadata · `localhost`

Plus 10/10 on an isolated logic harness including suffix-spoof
(`upload.wikimedia.org.evil.com`) and allowlist-in-query.

---

## 🟡 P2 — `ai-usage` DELETE was public

`src/app/api/ai-usage/route.ts` let anyone wipe usage counters — erasing the
evidence trail for quota abuse. Now dev-only.

---

## Pre-existing issues NOT fixed (need your decision)

- **In-memory rate limiting + auth codes** (`api-utils.ts`, `auth-codes.ts`).
  `new Map()` in serverless = per-instance. Limits are largely unenforced, and
  **codes issued by one instance can't be verified by another** — a real
  signup/reset failure in production, not just a security gap. Needs Upstash
  Redis or Firestore w/ TTL. This is the biggest remaining item.
- **`isPro` client-trusted** — persisted in localStorage; editing it unlocks Pro.
  Needs server-side entitlement checks on scan/export.
- **Firestore rules absent from repo** — verify in console; the project id and
  web API key are public.
- **`ai-usage` writes to `/tmp`** — ephemeral and per-instance on Vercel;
  counters silently reset.
- **`typescript.ignoreBuildErrors: true`** — type errors suppressed at build.
- **`@capacitor/*` imported but not in `package.json`** (`src/lib/native-mobile.ts`)
  — pre-existing build warnings, unrelated to these changes.

---

## Verification summary

```
home:            200
/api/health:     200
/api/search:     200   (regression check — still works)
compile errors:  none (excluding pre-existing capacitor warnings)

demo-activate    no auth   -> 404
webhook          unsigned  -> 503
verify-session   no auth   -> 401
image-proxy      4 SSRF vectors -> 403
secrets in src/  -> none
```
