import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "WorkRecord — Riwayat Kerja, Keputusan Lebih Pasti",
  description: "Kenali riwayat kerja calon tenaga kerja melalui WorkRecord. Platform pencatatan riwayat kerja dengan peran Admin dan Master untuk perusahaan, HRD, LPK, dan outsourcing.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="id"><body>{children}</body></html>}
