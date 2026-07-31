import { MetadataRoute } from "next";
import { getAllMedicinePages } from "@/lib/medicine-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://medsnap.vercel.app";
  const lastModified = new Date();

  return [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/#features`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#how-it-works`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#pricing`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/#faq`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/#about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Real screen URLs, now that each tab has its own path. Only
    // publicly meaningful, restorable screens are listed — transient ones
    // (/analyzing, /results) and auth-gated ones are deliberately omitted.
    {
      url: `${baseUrl}/browse`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/capture`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    // Directory hub — the internal-linking entry point for every brand page.
    {
      url: `${baseUrl}/medicine`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // One entry per medicine. These are the pages with a realistic chance of
    // ranking: "Rigix uses", "Myteka 10mg" and similar are low-competition
    // queries that the big drug sites do not cover in English.
    ...getAllMedicinePages().map((m) => ({
      url: `${baseUrl}/medicine/${m.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
