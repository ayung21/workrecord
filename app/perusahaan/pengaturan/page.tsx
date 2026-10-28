import { redirect } from "next/navigation";

/** Menu Pengaturan digabung ke Verifikasi dokumen. */
export default function PengaturanRedirectPage() {
  redirect("/perusahaan/verifikasi");
}
