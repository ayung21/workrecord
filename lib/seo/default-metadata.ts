import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";

const siteName = "WorkRecord";
const defaultTitle = "WorkRecord — Riwayat Kerja, Keputusan Lebih Pasti";
const defaultDescription =
  "Kenali riwayat kerja calon tenaga kerja melalui WorkRecord. Platform pencatatan riwayat kerja dengan peran Admin dan Master untuk perusahaan, HRD, LPK, dan outsourcing.";

export function buildRootMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s · ${siteName}`,
    },
    description: defaultDescription,
    applicationName: siteName,
    keywords: [
      "WorkRecord",
      "riwayat kerja",
      "verifikasi tenaga kerja",
      "HRD",
      "rekrutmen",
      "record pekerja",
      "LPK",
      "outsourcing",
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: "/",
      siteName,
      title: defaultTitle,
      description: defaultDescription,
      images: [
        {
          url: "/logo.png",
          width: 512,
          height: 512,
          alt: "WorkRecord",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: defaultTitle,
      description: defaultDescription,
      images: ["/logo.png"],
    },
    ...(googleVerification
      ? { verification: { google: googleVerification } }
      : {}),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icon.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      ],
      shortcut: "/favicon.ico",
      apple: [
        { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export const seoCopy = {
  siteName,
  defaultDescription,
} as const;
