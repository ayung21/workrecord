import type { Metadata } from "next";
import { SiteJsonLd } from "@/components/seo/site-json-ld";
import { buildRootMetadata } from "@/lib/seo/default-metadata";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

const googleTagId = "GTM-PQ82TJ27";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${googleTagId}');`,
          }}
        />
      </head>
      <body>
        <SiteJsonLd />
        {children}
      </body>
    </html>
  );
}
