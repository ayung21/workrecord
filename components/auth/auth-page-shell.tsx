"use client";

import Image from "next/image";
import Link from "next/link";
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
      title: "Aktifkan paket Kelola Record untuk tim Anda",
      lead:
        "Daftarkan perusahaan, buat dua akun (Admin & Master), lalu lanjut ke pembayaran langganan.",
      points: [
        "Data perusahaan dan kontak resmi",
        "Akun pembayar + akun kedua untuk login",
        "Syarat & ketentuan sebelum aktivasi",
      ],
      foot: "Pendaftaran hanya untuk perusahaan yang belum memiliki akun aktif.",
    },
    en: {
      eyebrow: "COMPANY REGISTRATION",
      title: "Activate Manage Records for your team",
      lead:
        "Register your company, create two accounts (Admin & Master), then continue to subscription payment.",
      points: [
        "Company details and official contacts",
        "Payer account + second login account",
        "Terms acceptance before activation",
      ],
      foot: "Registration is for companies without an active account yet.",
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
