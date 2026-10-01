import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "WorkRecord — Riwayat Kerja, Keputusan Lebih Pasti",
  description: "Kenali riwayat kerja calon tenaga kerja melalui WorkRecord. Platform pencatatan riwayat kerja dengan peran Admin dan Master untuk perusahaan, HRD, LPK, dan outsourcing.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="id"><body>{children}</body></html>}
