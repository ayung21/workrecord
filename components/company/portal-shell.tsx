"use client";

import Link from "@/components/app-link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { HeaderAuthLink } from "@/components/header-auth-link";
import { useCompanyPortalStatus } from "@/components/company/company-portal-status";

const links = [
  { href: "/perusahaan/cari", label: "Cari NIK" },
  { href: "/perusahaan/list", label: "List" },
  { href: "/perusahaan/report", label: "Report" },
  { href: "/perusahaan/iklan", label: "Iklan" },
  { href: "/perusahaan/verifikasi", label: "Verifikasi dokumen" },
];

export function PortalShell({
  children,
  lang = "id",
}: {
  children: React.ReactNode;
  lang?: "id" | "en";
}) {
  const pathname = usePathname();
  const { isActive, loading: statusLoading } = useCompanyPortalStatus();
  return (
    <div className="site-shell explore-page portal-shell-wide">
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="brand brand-home-logo" aria-label="Work Record">
            <Image
              src="/logo_dashboard.jpeg"
              alt=""
              width={44}
              height={44}
              className="brand-home-logo-img"
              priority
              unoptimized
            />
            <span className="brand-home-logo-text">WORK RECORD</span>
          </Link>
          <nav className="desktop-nav portal-nav">
            {links.map((l) => {
              const isVerification = l.href === "/perusahaan/verifikasi";
              const locked =
                !statusLoading && !isActive && !isVerification;
              if (locked) {
                return (
                  <span
                    key={l.href}
                    className="portal-nav-disabled"
                    title="Tersedia setelah perusahaan diverifikasi admin WorkRecord"
                  >
                    {l.label}
                  </span>
                );
              }
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={pathname === l.href ? "nav-active" : ""}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
          <HeaderAuthLink lang={lang} />
        </div>
      </header>
      <main className="explore-main">
        <div className="container explore-layout explore-layout-portal">
          {children}
        </div>
      </main>
    </div>
  );
}
