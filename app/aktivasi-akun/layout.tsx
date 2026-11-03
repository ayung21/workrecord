import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aktivasi Akun",
  robots: { index: false, follow: true },
};

export default function AktivasiAkunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
