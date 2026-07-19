# MedSnap — AI Medicine Identifier

Point your camera at any medicine. Know exactly what it is before you take it.

## Features

- **AI Vision Identification** — Upload a photo of any pill, tablet, or medicine box. Mistral Pixtral AI reads the text and identifies it.
- **Verified Sources** — Cross-checked against openFDA, RxNorm, and DailyMed (free government databases).
- **Full Medical Reports** — Uses, side effects, interactions, composition, pharmacology, storage instructions.
- **Allergy Alerts** — Add your allergies and get warnings when a scanned medicine matches.
- **Scan History** — Cloud-synced across all your devices (requires account).
- **Email Verification** — Secure signup with 6-digit code verification.
- **Google Sign-In** — One-click login with Google (skips email verification).
- **Landing Page** — Modern marketing site with pricing, features, testimonials.
- **Cookie Consent** — GDPR-compliant cookie banner.
- **AI Usage Tracking** — Monitor your AI API usage in Settings.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend:** Next.js API Routes (Node.js runtime)
- **Database:** Firebase Firestore (cloud sync) + localStorage (offline)
- **Auth:** Firebase Auth (email/password + Google)
- **AI:** Mistral Pixtral 12B (vision) + LLM7 Codestral (text)
- **Email:** Nodemailer + Gmail SMTP
- **Verified Data:** openFDA, RxNorm (NIH), DailyMed (NIH)

## Getting Started

### Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- Bun ([install](https://bun.sh))
- A Firebase project ([create one](https://console.firebase.google.com))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/medsnap.git
cd medsnap
```

2. Install dependencies:
```bash
bun install
```

3. Create environment files (see below).

4. Run the dev server:
```bash
bunx next dev -p 3000
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local` in the project root:

```env
# Firebase client config (from Firebase Console → Project Settings)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Firebase Admin SDK (for server-side auth management)
# Option A: Point to a service account JSON file
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
# Option B: Inline JSON (for Vercel — see Vercel setup below)
# FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# SMTP (for email verification codes)
# For Gmail: use an App Password (https://myaccount.google.com/apppasswords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=MedSnap <your-email@gmail.com>

# Database
DATABASE_URL=file:./db/custom.db
```

### Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save the JSON file as `firebase-service-account.json` in the project root
4. This file is already in `.gitignore` — it will NOT be committed

### AI API Keys

The app uses two free AI providers (keys are hardcoded in the API route):

- **Mistral Pixtral** (vision) — Get a free key at https://console.mistral.ai
- **LLM7 Codestral** (text) — Get a free key at https://llm7.io

To change the keys, edit `src/app/api/ai-search/route.ts` and update:
```typescript
const LLM7_API_KEY = "your-llm7-key";
const MISTRAL_API_KEY = "your-mistral-key";
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add environment variables (see above) in Vercel dashboard
4. For `FIREBASE_SERVICE_ACCOUNT`: paste the entire JSON as a single line
5. Deploy

### Vercel Environment Variables

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Your Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Your project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Your sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Your app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Your measurement ID |
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON (single line) from service account file |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Your Gmail App Password |
| `SMTP_FROM` | `MedSnap <your-email@gmail.com>` |
| `DATABASE_URL` | (not needed on Vercel — uses Firestore only) |

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── ai-search/          # AI medicine identification
│   │   ├── ai-usage/           # AI usage tracking
│   │   ├── auth/               # Email verification + password reset
│   │   ├── health/             # Health check (keep-alive)
│   │   ├── scan/               # Verified sources scan
│   │   └── search/             # Text-based medicine search
│   ├── globals.css             # Global styles + design system
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main app (routing + screen management)
├── components/
│   ├── brand/                  # Logo
│   ├── layout/                 # AppShell, TabBar, CookieConsent
│   ├── medicine/               # Medicine illustrations + primitives
│   ├── screens/                # All screens (landing, auth, home, etc.)
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── auth-context.tsx        # Firebase auth provider
│   ├── auth-codes.ts           # In-memory code store (TTL)
│   ├── email.ts                # Nodemailer SMTP
│   ├── firebase.ts             # Firebase client SDK
│   ├── firebase-admin.ts       # Firebase Admin SDK (server)
│   ├── firestore-service.ts    # Cloud sync
│   ├── store.ts                # Zustand state management
│   └── types.ts                # TypeScript types
└── proxy.ts                    # Next.js 16 proxy (middleware)
```

## License

This project is proprietary. All rights reserved.

## Disclaimer

MedSnap provides general information only and is not a substitute for professional medical advice. Always consult a doctor or pharmacist before starting, stopping, or changing any medication.
