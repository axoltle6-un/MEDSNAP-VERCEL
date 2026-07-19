# Running MedSnap in Cursor (Windows 10)

This guide walks you through setting up the MedSnap project in Cursor on Windows 10, end to end.

---

## Prerequisites

Install these on Windows 10 first:

### 1. Node.js 20+ (required)
- Download from https://nodejs.org (choose the **LTS** version)
- Run the installer with default options
- Verify in Command Prompt or PowerShell:
  ```powershell
  node --version    # should print v20.x.x or higher
  npm --version
  ```

### 2. Bun (recommended — the project uses Bun)
- Open PowerShell as Administrator and run:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- Close and reopen your terminal, then verify:
  ```powershell
  bun --version
  ```

### 3. Git
- Download from https://git-scm.com/download/win
- Verify: `git --version`

### 4. Cursor IDE
- Download from https://cursor.com
- Install and sign in

---

## Step 1 — Get the project files

The project lives at `/home/z/my-project/`. You need to copy it to your Windows machine.

### Option A — Download as a ZIP
If your platform exposes a file browser, download the entire project folder as a ZIP and extract it to e.g. `C:\Users\YourName\Projects\medsnap`.

### Option B — Initialize a git repo and push
In the cloud terminal:
```bash
cd /home/z/my-project
git init
git add -A
git commit -m "MedSnap initial"
# Then push to GitHub and clone on your Windows machine
```

---

## Step 2 — Open in Cursor

1. Open Cursor
2. **File → Open Folder…** → select the `medsnap` folder you extracted
3. Cursor will detect it's a Next.js project. If it offers to install recommended extensions, accept.

---

## Step 3 — Install dependencies

Open Cursor's integrated terminal (`Ctrl + ` `) and run:

```powershell
# Using Bun (recommended — faster)
bun install

# OR using npm (slower but works if Bun isn't installed)
npm install
```

This installs Next.js, React, Tailwind CSS, shadcn/ui, Zustand, framer-motion, z-ai-web-dev-sdk, and everything else.

---

## Step 4 — Set up the environment

The project uses `z-ai-web-dev-sdk` for the vision AI. It looks for a config file at one of:
- `./.z-ai-config` (in the project root)
- `~/.z-ai-config` (in your home directory)
- `/etc/.z-ai-config`

Create `.z-ai-config` in the project root with this content:

```json
{
  "baseUrl": "https://api.z.ai/api/paas/v1",
  "apiKey": "YOUR_ZAI_API_KEY"
}
```

Get an API key from https://z.ai (sign up → API keys → create one).

> Without this file, the `/api/scan` route will fail when it tries to call the vision model. The app will still work for the built-in medicine database matches, just not for AI vision extraction on unknown medicines.

> **Note:** The app now uses **free on-device OCR (Tesseract.js)** instead of the z-ai vision API for reading text from photos. The z-ai config is no longer required for basic scanning. However, the `.z-ai-config` file is still needed if you want to use the old AI vision fallback.

---

## Step 4b — Set up Firebase (for login + cloud sync)

The app supports Firebase Authentication and Firestore for cloud-syncing scan history and user preferences. **This is optional** — without Firebase, the app runs in "guest mode" (data stays on the device in localStorage).

### Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project** → name it (e.g. `medsnap`) → continue through the wizard
3. Once created, click the **Web icon** (`</>`) to add a web app
4. Register the app (nickname: `medsnap-web`) → you'll get a config object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "medsnap-xxxxx.firebaseapp.com",
     projectId: "medsnap-xxxxx",
     storageBucket: "medsnap-xxxxx.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

### Enable Authentication

1. In Firebase Console → **Build → Authentication → Get started**
2. Go to the **Sign-in method** tab
3. Enable **Email/Password** (toggle on, save)
4. Enable **Google** (toggle on, select a support email, save)

### Create Firestore database

1. In Firebase Console → **Build → Firestore Database → Create database**
2. Choose **Start in production mode** (or test mode for development)
3. Pick a location close to you → Enable

### Set up security rules

In Firestore → **Rules** tab, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

Publish the rules.

### Add config to your project

1. Copy `.env.example` to `.env.local` in the project root
2. Fill in the values from the Firebase config object:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=medsnap-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=medsnap-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=medsnap-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

3. Restart `bun run dev`

### Verify

When you open the app, you should now see the **login/signup screen** instead of going straight to onboarding. Create an account, and your scans + preferences will sync to the cloud.

> **Without Firebase configured:** the app shows a "Continue as guest" button on a warning screen. All data stays in localStorage. You can enable Firebase later without losing existing data — the app merges local scans into the cloud on first sign-in.

---

## Step 4c — Set up DeepSeek AI (for AI-powered medicine search)

The app has two search modes:
1. **Search verified sources** (free, always available) — searches openFDA, RxNorm, DailyMed
2. **Search with AI** (optional, requires API key) — uses DeepSeek to get richer, more comprehensive results

### Get a DeepSeek API key

1. Go to https://platform.deepseek.com/api_keys
2. Sign up / log in
3. Click "Create API Key"
4. Copy the key (starts with `sk-`)

### Add to your project

Add these lines to `.env.local`:

```env
DEEPSEEK_API_KEY=sk-your-key-here
```

That's it! The "Search with AI (DeepSeek)" button will now work on the scan confirmation screen.

### Optional: Use a different AI provider

The AI search route supports any OpenAI-compatible API. You can override the URL and model:

```env
DEEPSEEK_API_KEY=sk-or-your-openrouter-key
DEEPSEEK_API_URL=https://openrouter.ai/api/v1/chat/completions
DEEPSEEK_API_MODEL=deepseek/deepseek-chat-v3-0324:free
```

Other compatible providers:
- **OpenRouter**: `https://openrouter.ai/api/v1/chat/completions` (free tier available)
- **Groq**: `https://api.groq.com/openai/v1/chat/completions` (free, fast)
- **Together.ai**: `https://api.together.xyz/v1/chat/completions`
- **Any OpenAI-compatible API**

> **Without DeepSeek configured:** the "Search with AI" button will show an error message. The "Search verified sources" button still works perfectly (it's free and needs no key).

---

## Step 5 — Run the dev server

In Cursor's terminal:

```powershell
# Using Bun
bun run dev

# OR using npm
npm run dev
```

You should see:

```
▲ Next.js 16.x.x (Turbopack)
- Local:        http://localhost:3000
✓ Ready in 1.2s
```

Open **http://localhost:3000** in your browser (Chrome, Edge, Firefox — any modern browser).

---

## Step 6 — Camera permission (for the Scan feature)

When you tap **Scan** and choose the camera option, the browser will ask for camera permission. Click **Allow**.

If you're testing on a desktop without a camera, use the **"Upload from gallery"** button instead — it lets you pick a photo of a medicine from your computer.

---

## Step 7 — Edit and iterate

Cursor's killer feature is AI-assisted editing. Try these:

### Ask Cursor to make changes
- Press `Ctrl + K` to open the AI prompt inline
- Or press `Ctrl + L` to open the chat sidebar

Example prompts:
- "Make the home screen hero card use a black gradient instead of blue"
- "Add a 'Drug class' field to the results screen"
- "Add a new medicine to the database: Metformin 850 mg"

### Useful files to know
| File | What it does |
|------|--------------|
| `src/app/page.tsx` | Main orchestrator — controls which screen shows |
| `src/app/layout.tsx` | Root layout, fonts, metadata |
| `src/app/globals.css` | Color palette, dark mode, custom utilities |
| `src/app/api/scan/route.ts` | Vision AI + drug DB lookup endpoint |
| `src/app/api/search/route.ts` | Text-based drug search endpoint |
| `src/lib/store.ts` | Zustand state (navigation, history, profile) |
| `src/lib/medicine-db.ts` | Built-in medicine database |
| `src/lib/types.ts` | TypeScript types |
| `src/components/screens/*.tsx` | Each screen (home, results, settings, etc.) |
| `src/components/layout/*.tsx` | Tab bar, disclaimer banner, app shell |
| `tailwind.config.ts` | Tailwind theme (colors, fonts, animations) |
| `public/manifest.json` | PWA manifest |

---

## Step 8 — Lint and build

```powershell
# Check for errors
bun run lint

# Production build (optional — for deploying)
bun run build

# Run the production build
bun run start
```

---

## Step 9 — Deploy (optional)

This is a standard Next.js app, so you can deploy it to:

- **Vercel** (easiest — made by the Next.js team)
  1. Push your project to GitHub
  2. Go to https://vercel.com → New Project → import your repo
  3. Add the `ZAI_API_KEY` environment variable
  4. Deploy — done in 2 minutes

- **Netlify**, **Cloudflare Pages**, **Railway** — also support Next.js

---

## Troubleshooting

### "bun: command not found"
Install Bun (see Prerequisites step 2) or use `npm` instead.

### Camera doesn't open
- Make sure you're on `http://localhost:3000` (not `https://` — localhost is treated as secure)
- Check browser settings → Privacy → Camera → make sure it's allowed
- On Windows 10: Settings → Privacy → Camera → "Allow apps to access your camera"

### `/api/scan` returns 500
- Check that `.z-ai-config` exists and has a valid `apiKey`
- Check the terminal output for the actual error message

### Port 3000 already in use
- Run on a different port: `bun run dev -- -p 3001`

### Dark mode won't toggle
- The app uses `next-themes`. Make sure your browser allows JavaScript and cookies for localhost.

### Changes not showing
- Hard refresh: `Ctrl + Shift + R`
- Or clear the browser cache
- The Zustand store persists to localStorage — to reset everything: open DevTools → Application → Local Storage → clear `medsnap-store-v1`

---

## Tips for Cursor

- **`Ctrl + Shift + P`** → Command Palette (run any command)
- **`Ctrl + P`** → Quick open any file
- **`Ctrl + G`** → Jump to line number
- **`Ctrl + D`** → Select next occurrence of word under cursor
- **`Alt + ↑/↓`** → Move line up/down
- **`Ctrl + /`** → Toggle comment

For AI features:
- **Ctrl + K** — inline edit (highlight code first)
- **Ctrl + L** — chat with context of current file
- **Ctrl + I** — full composer (multi-file edits)

When asking Cursor to change UI, reference the design system in `src/app/globals.css` — all colors, shadows, and radii are defined there as CSS variables.
