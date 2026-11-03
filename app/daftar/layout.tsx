import type { Metadata } from "next";
import { RequireGuest } from "@/components/auth/require-guest";

export const metadata: Metadata = {
  title: "Daftar Perusahaan",
  description:
    "Daftarkan perusahaan Anda gratis di WorkRecord. Verifikasi identitas, kelola record pekerja, dan telusuri riwayat kerja dalam satu platform.",
  alternates: { canonical: "/daftar" },
  openGraph: {
    title: "Daftar Perusahaan · WorkRecord",
    description:
      "Pendaftaran perusahaan gratis — verifikasi akun lalu akses portal Admin dan Master WorkRecord.",
    url: "/daftar",
  },
};

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireGuest>{children}</RequireGuest>;
}
