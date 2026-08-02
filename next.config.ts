import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /**
   * The app is a single-page state machine rendered from "/". Screens are
   * mirrored into the URL (/capture, /browse, ...) via the History API, so
   * those paths have no page.tsx of their own — a hard refresh or a shared
   * link would 404 without this. Rewriting them to "/" lets the client adopt
   * the path on mount (see use-url-sync.ts) and render the right screen.
   */
  async rewrites() {
    const screenPaths = [
      "/dashboard",
      "/capture",
      "/browse",
      "/search",
      "/history",
      "/settings",
      "/results",
      "/results/details",
      "/analyzing",
      "/login",
      "/reset-password",
      "/verify-email",
      "/welcome",
      "/upgrade",
      "/checkout",
      "/legal/disclaimer",
      "/legal/terms",
      "/legal/privacy",
    ];
    return screenPaths.map((source) => ({ source, destination: "/" }));
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Cross-Origin-Opener-Policy — allow Google sign-in popups & Stripe
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          // HTTP Strict Transport Security — force HTTPS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // X-Frame-Options — allow framing for authentication and checkout
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // X-Content-Type-Options — prevent MIME sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Referrer-Policy — limit referrer info
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions-Policy — allow camera, microphone for voice search, and payment for Stripe
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(), payment=(self)",
          },
          // Content-Security-Policy — restrict resource loading while allowing Tesseract OCR blob workers, Firebase Auth & Stripe
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // 'unsafe-eval' removed — it permits eval()/new Function() on ANY
            // string, which turns a single injection into arbitrary script
            // execution. The only real need here is tesseract.js compiling its
            // WASM core, and that is covered by 'wasm-unsafe-eval', which
            // allows WebAssembly compilation and nothing else.
            //
            // 'unsafe-inline' is retained for now: Next.js emits inline
            // bootstrap scripts and removing it requires nonce plumbing
            // through the App Router. Tracked separately — dropping
            // 'unsafe-eval' already closes the larger class of attack.
            "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net https://unpkg.com https://www.gstatic.com https://www.googleapis.com https://apis.google.com https://js.stripe.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob: https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com https://js.stripe.com https://checkout.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://tessdata.projectnaptha.com https://api.fda.gov https://rxnav.nlm.nih.gov https://dailymed.nlm.nih.gov https://api.mistral.ai https://api.llm7.io https://api.openrouter.ai https://upload.wikimedia.org https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://pubchem.ncbi.nlm.nih.gov https://api.stripe.com",
              "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://*.firebase.com https://js.stripe.com https://checkout.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
