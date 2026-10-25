"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import { Check, ShieldCheck } from "lucide-react";
import { HeaderAuthLink } from "@/components/header-auth-link";

const panelCopy = {
  login: {
    id: {
      eyebrow: "AKSES PERUSAHAAN",
      title: "Masuk dengan aman ke portal WorkRecord",
      lead:
        "Kelola record karyawan, verifikasi dokumen, dan proses persetujuan dalam satu tempat.",
      points: [
        "Peran Admin dan Kepemimpinan PT",
        "Persetujuan record yang terstruktur",
        "Data dilindungi sesi login Anda",
      ],
      foot:
        "Hanya untuk akun perusahaan dan Owner platform.",
    },
    en: {
      eyebrow: "COMPANY ACCESS",
      title: "Sign in securely to WorkRecord",
      lead:
        "Manage employee records, document verification, and approvals in one place.",
      points: [
        "Admin and company Leadership roles",
        "Structured record approvals",
        "Your data protected by sign-in session",
      ],
      foot: "For company accounts and platform Owner only.",
    },
  },
  register: {
    id: {
      eyebrow: "PENDAFTARAN PERUSAHAAN",
      title: "Daftarkan Perusahaan Anda Secara Gratis",
      lead:
        "Daftarkan perusahaan Anda secara GRATIS. Lengkapi identitas perusahaan dan dokumen legalitas untuk proses verifikasi. Setelah akun disetujui, perusahaan dapat mengakses layanan WorkRecord melalui akun Master dan Admin",
      points: [
        "Lengkapi data perusahaan, penanggung jawab, dan kontak resmi",
        "Kelola dan telusuri riwayat kerja pekerja melalui akun perusahaan.",
        "Setujui Syarat & Ketentuan, kemudian tunggu proses verifikasi oleh tim WorkRecord.",
      ],
      foot: "Pendaftaran dan penggunaan WorkRecord GRATIS. Biaya hanya dikenakan untuk layanan pengajuan sanggahan terhadap data atau catatan pekerja.\n Pendaftaran khusus untuk perusahaan yang belum memiliki akun WorkRecord aktif.",
    },
    en: {
      eyebrow: "COMPANY REGISTRATION",
      title: "Register Your Company for Free",
      lead:
        "Register your company for FREE. Complete your company identity and legal documents for verification. Once approved, your company can access WorkRecord through Master and Admin accounts.",
      points: [
        "Complete company details, authorized representative, and official contact information",
        "Manage and review employee work history through your company account.",
        "Accept the Terms & Conditions, then wait for verification by the WorkRecord team.",
      ],
      foot:
        "WorkRecord registration and use are FREE. Fees apply only when submitting disputes against employee data or records.\n Registration is for companies that do not yet have an active WorkRecord account.",
    },
  },
};

type Props = {
  lang: "id" | "en";
  onLangChange: (lang: "id" | "en") => void;
  children: React.ReactNode;
  variant?: "login" | "register";
  contentClassName?: string;
};

export function AuthPageShell({
  lang,
  onLangChange,
  children,
  variant = "login",
  contentClassName,
}: Props) {
  const p = panelCopy[variant][lang];

  return (
    <div className="auth-page">
      <aside className="auth-panel" aria-hidden={false}>
        <div className="auth-panel-inner">
          <Link href="/" className="auth-panel-logo">
            <Image
              src="/brand/logo.png"
              alt="WorkRecord"
              width={200}
              height={80}
              className="auth-panel-logo-img"
              priority
            />
          </Link>
          <p className="auth-panel-eyebrow">{p.eyebrow}</p>
          <h2 className="auth-panel-title">{p.title}</h2>
          <p className="auth-panel-lead">{p.lead}</p>
          <ul className="auth-panel-points">
            {p.points.map((item) => (
              <li key={item}>
                <span className="auth-panel-check">
                  <Check size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="auth-panel-foot">
            <ShieldCheck size={16} />
            {p.foot}
          </p>
        </div>
        <div className="auth-panel-orb auth-panel-orb-a" aria-hidden />
        <div className="auth-panel-orb auth-panel-orb-b" aria-hidden />
      </aside>

      <div className="auth-main">
        <header className="auth-topbar">
          <div className="auth-topbar-actions">
            <div className="language" aria-label="Language">
              <button
                type="button"
                aria-pressed={lang === "id"}
                onClick={() => onLangChange("id")}
              >
                ID
              </button>
              <span>/</span>
              <button
                type="button"
                aria-pressed={lang === "en"}
                onClick={() => onLangChange("en")}
              >
                EN
              </button>
            </div>
            <HeaderAuthLink lang={lang} />
          </div>
        </header>
        <div
          className={
            contentClassName
              ? `auth-main-content ${contentClassName}`
              : "auth-main-content"
          }
        >
          {children}
        </div>
      </div>
    </div>
  );
}
