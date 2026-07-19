# MedSnap — Technical Architecture & Operations Guide (M&A Due Diligence)

## 📌 Executive Technology Summary
**MedSnap** is a production-ready, standalone Next.js 16 (App Router) + React 19 Progressive Web Application designed for AI-powered medication identification and verified clinical report generation.

---

## 🛠️ Complete Tech Stack
* **Framework**: Next.js 16 (Standalone Output)
* **Frontend Library**: React 19, TypeScript (Strict Type Safety)
* **Styling & Motion**: Tailwind CSS 4, Framer Motion (Spring Physics), Lucide Icons, Shadcn/UI
* **State Management**: Zustand with `persist` middleware (`medsnap-store-v3`) & localStorage
* **Authentication**: Firebase Authentication (Google OAuth + Custom 6-digit SHA-256 Hashed SMTP OTP)
* **Cloud Sync**: Firebase Cloud Firestore (Real-time account synchronization)
* **OCR & Vision Models**: Tesseract.js (Browser canvas processing) + Mistral Pixtral 12B (Multi-modal vision) & LLM7 Codestral
* **Integrated Databases**: openFDA (USA), NIH RxNorm, NIH RxClass, NIH PubChem, DailyMed, DRAP (Pakistan), NMPA (China)
* **Payments & Tax**: Stripe API + 40-country sales tax engine

---

## 🔒 Security Architecture
1. **SHA-256 OTP Storage & Constant-Time Hash Check**: Verification codes are stored strictly as SHA-256 hashes and verified using `crypto.timingSafeEqual` to eliminate side-channel timing attacks.
2. **Auto Bearer Token Injection**: `safeFetch` auto-attaches cryptographically signed Firebase ID tokens (`Authorization: Bearer <idToken>`).
3. **Dual Rate Limiting**: Sliding-window rate limiting on client IP and target account emails to prevent brute-force attacks.
4. **SSRF-Protected Image Proxy**: Proxy endpoint enforces domain whitelisting (`upload.wikimedia.org`, `rximage.nlm.nih.gov`, `dailymed.nlm.nih.gov`, `open.fda.gov`) and blocks private IPs.
5. **Strict Content-Security-Policy**: Enforces strict CSP and HSTS headers in `next.config.ts`.

---

## 🚀 Deployment & Operating Overhead
* **Hosting**: Vercel Serverless Edge (Zero monthly server cost)
* **Database Quota**: Free tier Firebase Cloud Firestore
* **Total Operating Cost**: **$0.00 / month**

---

*MedSnap Confidential M&A Asset Documentation for Acquire.com Listing.*
