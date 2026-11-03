import type { Metadata } from "next";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { buildRootMetadata } from "@/lib/seo/default-metadata";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
