import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/auth/", "/api/stripe/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/auth/", "/api/stripe/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/auth/", "/api/stripe/"],
      },
    ],
    sitemap: "https://medsnap.app/sitemap.xml",
  };
}
