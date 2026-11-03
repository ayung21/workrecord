import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "WorkRecord — Riwayat Kerja, Keputusan Lebih Pasti",
  description: "Kenali riwayat kerja calon tenaga kerja melalui WorkRecord. Platform pencatatan riwayat kerja dengan peran Admin dan Master untuk perusahaan, HRD, LPK, dan outsourcing.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="id"><body>{children}</body></html>}
