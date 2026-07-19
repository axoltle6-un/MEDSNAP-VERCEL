"use client";

import dynamic from "next/dynamic";
import { LoadingSplash } from "@/components/loading-splash";

// Dynamically import the client app router without SSR to eliminate all SSR vs Client
// hydration mismatches and React 19 hook order errors (#310).
const AppMain = dynamic(
  () => import("@/components/app-main").then((mod) => mod.AppMain),
  {
    ssr: false,
    loading: () => <LoadingSplash message="Loading MedSnap…" />,
  }
);

export default function Home() {
  return <AppMain />;
}
