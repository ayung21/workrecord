import type { Metadata } from "next";
import Script from "next/script";
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
        <Script id="gtm-datalayer" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
          `}
        </Script>
        <Script
          id="gtm-js"
          src="https://www.googletagmanager.com/gtm.js?id=GTM-PQ82TJ27"
          strategy="afterInteractive"
        />
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
