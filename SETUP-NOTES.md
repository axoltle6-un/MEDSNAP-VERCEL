# Setup Notes — npm install

## TL;DR

```bash
npm install     # works with no flags now
npm run dev     # http://localhost:3000
```

`package-lock.json` is committed — 1099 packages, every entry with a resolved
URL + integrity hash, so installs are reproducible.

---

## What changed

### 1. `package-lock.json` added (new, ~579 KB)
The repo shipped only `bun.lock`. There was no npm lockfile, so `npm install`
resolved fresh every time and could drift from what Bun installs. Now pinned.

### 2. `next-auth` removed from dependencies

`npm install` **failed outright** on a clean clone:

```
npm error ERESOLVE unable to resolve dependency tree
npm error Found: nodemailer@9.0.3
npm error Could not resolve dependency:
npm error peerOptional nodemailer@"^7.0.7" from next-auth@4.24.15
```

`next-auth@4.24.x` declares a peer of `nodemailer@^7`; this project uses
`nodemailer@^9`. Bun resolves peer ranges loosely so it never surfaced — but
anyone cloning with npm hit a hard failure.

Checked whether `next-auth` was actually used:

```bash
grep -rn "next-auth" src/     # → no matches
```

**It is imported nowhere.** The app authenticates entirely through Firebase
Auth (`src/lib/auth-context.tsx`, `src/lib/firebase.ts`). `next-auth` was an
unused leftover — most likely from the starter template this was scaffolded
from, same origin as the untouched Prisma `Post` model.

Removing it fixes the conflict at the root, so no `--legacy-peer-deps` band-aid
is needed. `nodemailer@9` (used for real in `src/lib/email.ts`) is untouched.

> If you *do* intend to add next-auth later, revert this and either pin
> `nodemailer@^7` or keep `legacy-peer-deps=true` in an `.npmrc`.

---

## Known warnings (non-blocking)

**`firebase-admin@14.2.0` wants Node >= 22.** Installs and runs on Node 20 with
an `EBADENGINE` warning, but the Admin SDK paths — email verification codes,
`/api/stripe/demo-activate`, `verifyAuthToken` — may behave inconsistently.
Use Node 22+ if you're testing auth flows.

Assorted deprecation notices (`glob@10`, `uuid@9`, `recharts@2`) come from
transitive deps. Harmless for now.

---

## `.env.local`

Created for local dev with the **public** Firebase client config (safe — web
API keys ship in the client bundle by design).

Secret slots — `MISTRAL_API_KEY`, `LLM7_API_KEY`, `SMTP_PASS`, Stripe — are
deliberately **left blank**. Filling them in would just re-activate the
credentials currently leaked in the public repo.

Leaving them empty means the code silently falls back to the hardcoded values
in `src/app/api/ai-search/route.ts:33-34` and `src/lib/email.ts:12-16`. That
fallback pattern is the bug worth deleting — see `MEDSNAP-ANALYSIS.md` §2.

`.env.local` is gitignored and will not be committed.

---

## Verified

```
▲ Next.js 16.2.12 (Turbopack)
✓ Ready in 560ms
GET /              → 200
GET /api/health    → 200
compile errors     → none
```

The photo-leak fix (`results.tsx`, `browse.tsx`, `search.tsx`) compiles clean.
