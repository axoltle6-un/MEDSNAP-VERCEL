# Deployment

## What was added

| File | Purpose |
|---|---|
| `.github/workflows/deploy.yml` | CI: lint, typecheck, build, secret scan → preview/production deploy |
| `.nvmrc` + `engines` | Pin Node 22 (`firebase-admin@14` requires `>=22`) |
| `package.json` `build` | Fixed — was unrunnable outside its original machine |

---

## Two problems found while wiring this up

### 1. The `build` script could not run anywhere but the author's laptop

The committed build command was:

```
python3 scripts/generate-env.py && next build && ... && cp .env ... && cp .z-ai-config ...
```

`scripts/generate-env.py` has absolute paths baked in:

```
/home/z/my-project/.env.local
/home/z/my-project/firebase-service-account.json
/home/z/my-project/.env
```

Those directories don't exist on Vercel, in CI, or on your machine. It also
copies `.env` and `.z-ai-config` — **neither is in the repo** (both gitignored).
So `npm run build` fails immediately on a fresh clone.

Production wasn't affected only because `vercel.json` overrides `buildCommand`
with a plain `next build`. That means **the documented build and the actual
deployed build were different** — local builds failing while prod worked, which
is a nasty class of bug to debug.

Fixed: `build` is now `next build`, matching what Vercel actually runs. The
standalone/Bun variant is preserved as `build:standalone` minus the broken
Python steps.

Verified — full production build passes, all 16 API routes compiled:

```
Route (app)
┌ ○ /                              ƒ /api/scan
├ ƒ /api/ai-search                 ƒ /api/search
├ ƒ /api/auth/*  (4 routes)        ƒ /api/stripe/*  (5 routes)
└ ○ /sitemap.xml
EXIT=0
```

### 2. Node version was unpinned

`firebase-admin@14.2.0` requires Node `>=22`; Vercel would otherwise pick its
default. On Node 20 the Admin SDK paths — email verification, Stripe
entitlement writes, `verifyAuthToken` — emit `EBADENGINE` and can misbehave at
runtime. Now pinned via `.nvmrc` and `engines`.

---

## The workflow

Runs on push to `main`, on PRs, and manually.

**`verify`** — `npm ci` (enforces the lockfile), lint, `tsc --noEmit`, `next build`.

> Typecheck is non-blocking for now. `next.config.ts` sets
> `typescript.ignoreBuildErrors: true`, so `next build` catches **zero** type
> errors across 22.8k lines. The separate `tsc` step surfaces them without
> blocking the pipeline. Flip `continue-on-error: false` once they're cleared.

**`secret-scan`** — blocks the failure mode this repo already hit:
- Stripe/GitHub/Slack keys and private-key blocks
- **Base64-obfuscated secrets** — specifically catches the
  `Buffer.from("<base64>", "base64")` pattern that was used here with the
  comment *"decoded at runtime to pass GitHub secret scanning protection."*
  Encoding is not encryption; that trick hid the key from scanners, not attackers.
- Any tracked `.env` or `firebase-service-account.json`

**`deploy-preview`** (PRs) / **`deploy-production`** (main) — both **skip
cleanly if `VERCEL_TOKEN` is unset**, so the workflow is useful as pure CI if
you stay on Vercel's Git integration. Production ends with a `/api/health`
smoke test that fails the run if the app doesn't come up.

---

## Setup

### Option A — keep Vercel's Git integration (recommended)

Do nothing. Vercel already deploys on push; this workflow adds the checks it
doesn't run. Deploy jobs skip automatically.

### Option B — deploy from GitHub Actions

Settings → Secrets and variables → Actions:

| Secret | Where to find it |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | same file |

Then disable Vercel's Git integration to avoid double deploys.

### Gate production behind approval

Settings → Environments → `production` → Required reviewers. Given this app
handles payments and medical data, worth doing.

---

## ⚠️ Required env vars — the app will not work without these

The security fixes made all credentials **env-only, failing closed with `503`**
instead of falling back to the hardcoded values that leaked. Set these in
Vercel → Settings → Environment Variables:

| Variable | Effect if missing |
|---|---|
| `MISTRAL_API_KEY` | AI photo identification degrades to .gov sources |
| `LLM7_API_KEY` | AI text search degrades to .gov sources |
| `SMTP_USER` / `SMTP_PASS` | **Signup and password reset break** — no codes sent |
| `SMTP_FROM`, `SMTP_HOST`, `SMTP_PORT` | Defaults to Gmail if unset |
| `STRIPE_SECRET_KEY` | Checkout returns `503` |
| `STRIPE_WEBHOOK_SECRET` | **Webhook returns `503`** — Pro never activates after payment |
| `FIREBASE_SERVICE_ACCOUNT` | Admin SDK unavailable; auth routes fail |
| `NEXT_PUBLIC_FIREBASE_*` | Client auth/Firestore unavailable |

**Rotate before setting.** The old values are still in git history at `55b0b44`
in a public repo. Reusing them just re-leaks them.

`STRIPE_WEBHOOK_SECRET` is the one most likely to be missed — it was optional
before (the webhook accepted unsigned events, which was the payment bypass).
It's now mandatory.

---

## Still outstanding

- **In-memory rate limiter + auth-code store** — `new Map()` doesn't survive
  serverless. Codes issued by one instance can't be verified by another, so
  signup/reset fail intermittently in production **today**. Needs Upstash Redis.
  Biggest remaining item.
- **Google sign-in** — Firebase Console → Authentication → Settings →
  Authorized domains → add your Vercel domain.
- **Firestore rules** — not in the repo; the only thing protecting user scan history.
- **`isPro` client-trusted** — editing localStorage unlocks Pro.
