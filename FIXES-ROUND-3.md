# Round 3 — Cookies, Images, Credentials

## 1. 🖼️ Wrong medicine photos — FIXED

### The bug you reported
Browse showed photos of the wrong drug. Reproduced live:

```
ADVIL COLD AND SINUS  →  A_course_of_green_cefalexin_pills.jpg
```

Advil (ibuprofen) was displaying a photo of **cefalexin**, a completely
different drug — an antibiotic. On a medicine identifier, that's a safety
defect, not a cosmetic one.

### Root cause — two compounding failures

**a) NIH RxImage is dead.** `rximage.nlm.nih.gov` no longer resolves at all:

```
rximage.nlm.nih.gov    DNS-FAIL   NXDOMAIN
dailymed.nlm.nih.gov   DNS-OK     302
api.fda.gov            DNS-OK     200
pubchem.ncbi.nlm.nih.gov DNS-OK   200
```

NLM decommissioned it. It was priority #1 in `getMedicineImage()`, so every
lookup burned a full 10s timeout, failed, and fell through to Wikipedia.

**b) Wikipedia fuzzy search returns generic stock articles.** When it can't
match a brand it returns `Capsule (pharmacy)`, whose lead image is a stock
photo of green cefalexin pills. `isMedicalImage()` accepted it because it *is*
a genuine pill photo — just of the wrong medicine. The filter checked "is this
medical?" but never "is this the drug we asked for?"

### The fix
- **Title gating** (`wikiTitleMatchesDrug`) — a Wikipedia image is only used if
  the article title actually names the drug. 26 generic titles
  (`Capsule (pharmacy)`, `Tablet`, `Pharmacy`, …) are hard-rejected.
- Widened search from 1 → 5 candidates, since the top hit is often the stock article.
- **Reordered priority:** brand photo → generic photo → PubChem structure.
  Chemical diagrams are always *correct* but aren't what users are holding, so
  they're now a last resort rather than second choice.
- **RxImage disabled** behind `RXIMAGE_ENABLED = false` — removes ~10s of dead
  latency per lookup. Re-enable if NLM ever restores it.
- **Fails to `null`** rather than guessing — the UI then draws its own
  illustration instead of showing a misleading photo.

### Verified
```
BEFORE:  ADVIL COLD AND SINUS  →  ...green_cefalexin_pills.jpg   ← WRONG DRUG
AFTER:   ADVIL COLD AND SINUS  →  ...Ibuprofen-3D-balls.png      ← correct
```
Plus 8/8 on an isolated logic harness.

> **On "use AI to show the images":** I deliberately did not generate pill
> images with AI. A synthesised photo of a pill is a plausible-looking
> fabrication — if it doesn't match what's in the user's hand, it actively
> encourages a wrong identification. Verified-source-or-nothing is the correct
> behaviour for a medical tool. AI vision is already used to *read* the photo
> (Mistral Pixtral in `/api/ai-search`), which is the safe direction.

---

## 2. 🍪 Cookie consent — now actually works

The banner was **purely decorative**. `cookieConsent` was written to the store
and read by nothing:

```
src/lib/store.ts:90,371,372,472   ← definition + persistence only
```

No analytics were gated, no cookie was written, and **"Reject" did exactly the
same thing as "Accept."** For a GDPR banner that's a compliance problem, not
just a bug — it asked for a choice it never honoured.

**New `src/lib/consent.ts`:**
- Writes a real first-party cookie (`medsnap_cookie_consent`, 1yr, `SameSite=Lax`,
  `Secure` on HTTPS) — survives localStorage clears.
- **Gates Firebase Analytics** — dynamically imported, so on rejection the SDK
  is never even fetched.
- `disableAnalytics()` calls `setAnalyticsCollectionEnabled(false)` and deletes
  `_ga` / `_gid` / `_ga_*` / `_gac_*` cookies across host and registrable domain.
- Re-applies the decision on every load; cookie is authoritative and heals the store.

Also added `getAppInstance()` to `firebase.ts` (Analytics needs the app handle).

Note: analytics was *never initialised anywhere* before, so nothing was being
tracked regardless. The consent layer is now real and ready for when it is.

---

## 3. 🔑 Credentials — what I can and cannot do

Firebase client config is wired in `.env.local` and the project responds:

```
identitytoolkit.googleapis.com → 400 (reachable; 400 = empty test payload)
```

**Google sign-in needs one thing I can't do from here:** authorise the domain.
Firebase Console → Authentication → Settings → Authorized domains → add
`localhost` and your Vercel domain. Without it, the popup opens and immediately
fails with `auth/unauthorized-domain`.

**AI keys — deliberately left blank.** The old Mistral key is *still live*
(HTTP 200) and still in git history at `55b0b44`. I'm not re-inserting a leaked
credential. Once you rotate:

```
MISTRAL_API_KEY=<new>     # console.mistral.ai
LLM7_API_KEY=<new>        # llm7.io
```

Until then `/api/ai-search` degrades cleanly to verified .gov sources rather
than erroring — that path is now explicit instead of firing an empty Bearer token.

---

## Status

```
home: 200 · compile errors: none (excl. pre-existing @capacitor warnings)
Advil image: correct (Ibuprofen, was cefalexin)
```

**Still open** (from earlier rounds, unchanged):
- In-memory rate limits + auth codes — breaks signup/reset on serverless. Biggest item.
- `isPro` client-trusted.
- Firestore rules not in repo.
- Rotate the leaked keys, then rewrite git history (still 1 commit).
