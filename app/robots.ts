import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/perusahaan/",
        "/jelajahi",
        "/payments/",
        "/login",
        "/lupa-password",
        "/aktivasi-akun",
      ],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
