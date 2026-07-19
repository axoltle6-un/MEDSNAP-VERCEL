import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { KeepAlive } from "@/components/keep-alive";
import { CookieConsent } from "@/components/layout/cookie-consent";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://medsnap.app"),
  title: {
    default: "MedSnap AI — Instant Medicine & Pill Identifier by Picture",
    template: "%s | MedSnap AI",
  },
  description:
    "Point your camera at any pill, tablet, capsule, or prescription box to identify it instantly. Cross-referenced live with openFDA, RxNorm, NIH, DRAP (Pakistan), and NMPA (China) drug databases.",
  keywords: [
    "medicine identifier",
    "pill identifier by picture",
    "pill finder by color and shape",
    "AI medicine scanner",
    "drug lookup tool",
    "pill imprint code lookup",
    "drug interaction checker",
    "openFDA medicine database",
    "RxNorm pill lookup",
    "DRAP Pakistan drug search",
    "NMPA China medicine identifier",
    "prescription label scanner",
    "OTC drug lookup",
    "pharmaceutical OCR",
    "MedSnap AI",
    "allergy warning radar",
    "medication safety app",
  ],
  authors: [{ name: "MedSnap AI", url: "https://medsnap.app" }],
  creator: "MedSnap AI",
  publisher: "MedSnap AI Health Tech",
  category: "medical",
  applicationName: "MedSnap AI",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedSnap AI",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "https://medsnap.app",
    languages: {
      "en-US": "https://medsnap.app",
      "es-ES": "https://medsnap.app/?lang=es",
      "fr-FR": "https://medsnap.app/?lang=fr",
      "de-DE": "https://medsnap.app/?lang=de",
      "ar-SA": "https://medsnap.app/?lang=ar",
    },
  },
  openGraph: {
    title: "MedSnap AI — Instant Medicine & Pill Identifier by Picture",
    description:
      "Snap a photo of any pill, capsule, or package to identify it instantly. Cross-checked live with openFDA, RxNorm, DRAP, and NMPA registries.",
    url: "https://medsnap.app",
    siteName: "MedSnap AI",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 1200,
        height: 630,
        alt: "MedSnap AI Medicine Identifier Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MedSnap AI — Instant Medicine & Pill Identifier by Picture",
    description:
      "Point your camera at any pill or medicine box to identify it instantly with verified openFDA & RxNorm drug summaries.",
    creator: "@medsnap_app",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://medsnap.app/#webapp",
        "name": "MedSnap AI Medicine Identifier",
        "url": "https://medsnap.app",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "Web, Android, iOS",
        "description":
          "AI-powered pill and medicine identifier by camera photo, imprint code, or name search.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "1280",
          "bestRating": "5",
          "worstRating": "1",
        },
        "featureList": [
          "Multi-Modal AI Vision Pill Scanner",
          "openFDA & RxNorm Government Registry Lookups",
          "DRAP Pakistan & NMPA China Medicine Registries",
          "Interactive Side-by-Side Drug Comparison Matrix",
          "Proactive Allergy & Interaction Warning Radar",
          "High-Resolution Vector Zoom OCR Inspector",
        ],
      },
      {
        "@type": "MedicalWebPage",
        "@id": "https://medsnap.app/#medicalpage",
        "name": "MedSnap AI Pill & Medicine Database Search",
        "url": "https://medsnap.app",
        "medicalSpecialty": ["ClinicalPharmacology", "GeneralPractice"],
        "medicalAudience": [
          {
            "@type": "MedicalAudience",
            "audienceType": "Patients",
          },
          {
            "@type": "MedicalAudience",
            "audienceType": "Caregivers",
          },
        ],
        "citation": [
          "https://open.fda.gov",
          "https://rxnav.nlm.nih.gov",
          "https://www.drap.gov.pk",
          "https://www.nmpa.gov.cn",
          "https://pubchem.ncbi.nlm.nih.gov",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": "https://medsnap.app/#faq",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How do I identify a pill by taking a photo?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Simply open MedSnap AI on your mobile browser or app, click 'Scan a medicine', and take a clear picture of the pill, capsule, or prescription box label. MedSnap AI extracts text, imprint codes, shape, and colors to match against official drug registries.",
            },
          },
          {
            "@type": "Question",
            "name": "Which official drug databases does MedSnap search?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "MedSnap cross-references live data directly from US openFDA, NIH RxNorm, NIH DailyMed, PubChem, DRAP (Drug Regulatory Authority of Pakistan), and NMPA (National Medical Products Administration China).",
            },
          },
          {
            "@type": "Question",
            "name": "Can MedSnap check for drug-drug interactions and user allergies?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes. MedSnap features an active Interaction Radar and Side-by-Side Comparison Matrix that checks active formula ingredients against your recorded allergy profile and flags potential double-dosing or contraindications.",
            },
          },
          {
            "@type": "Question",
            "name": "Is MedSnap AI free to use?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text":
                "Yes, MedSnap provides free daily camera scans and unlimited text database lookups across all global medical registries.",
            },
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": "https://medsnap.app/#organization",
        "name": "MedSnap AI Health Tech",
        "url": "https://medsnap.app",
        "logo": "https://medsnap.app/logo.svg",
        "sameAs": ["https://github.com/axoltle6-un/MEDSNAP-VERCEL"],
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body
        className={`${inter.variable} ${bricolage.variable} antialiased bg-background text-foreground font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <TooltipProvider>
              {children}
              <KeepAlive />
              <CookieConsent />
              <Toaster />
              <SonnerToaster position="top-center" />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
