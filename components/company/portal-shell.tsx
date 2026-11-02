"use client";

import Link from "@/components/app-link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { HeaderAuthLink } from "@/components/header-auth-link";
import { useCompanyPortalStatus } from "@/components/company/company-portal-status";
import { readSession } from "@/lib/auth/session";

const baseLinks = [
  { href: "/perusahaan/cari", label: "Cari NIK" },
  { href: "/perusahaan/list", label: "List" },
  { href: "/perusahaan/report", label: "Report" },
  { href: "/perusahaan/iklan", label: "Iklan" },
  { href: "/perusahaan/verifikasi", label: "Verifikasi dokumen" },
  {
    href: "/perusahaan/pengaturan",
    label: "Pengaturan",
    leadershipOnly: true as const,
  },
];

type PortalLink = (typeof baseLinks)[number];

function isLinkLocked(
  l: PortalLink,
  statusLoading: boolean,
  isActive: boolean,
): boolean {
  const isVerification = l.href === "/perusahaan/verifikasi";
  const isSettings = l.href === "/perusahaan/pengaturan";
  return !statusLoading && !isActive && !isVerification && !isSettings;
}

function PortalNavItem({
  l,
  pathname,
  statusLoading,
  companyActive,
  onNavigate,
  className,
}: {
  l: PortalLink;
  pathname: string;
  statusLoading: boolean;
  companyActive: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const locked = isLinkLocked(l, statusLoading, companyActive);
  if (locked) {
    return (
      <span
        className={`portal-nav-disabled${className ? ` ${className}` : ""}`}
        title="Tersedia setelah perusahaan diverifikasi admin WorkRecord"
      >
        {l.label}
      </span>
    );
  }
  return (
    <Link
      href={l.href}
      className={`${pathname === l.href ? "nav-active" : ""}${className ? ` ${className}` : ""}`}
      onClick={onNavigate}
    >
      {l.label}
    </Link>
  );
}

export function PortalShell({
  children,
  lang = "id",
}: {
  children: React.ReactNode;
  lang?: "id" | "en";
}) {
  const pathname = usePathname();
  const { isActive, loading: statusLoading } = useCompanyPortalStatus();
  const session = readSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = useMemo(
    () =>
      baseLinks.filter(
        (l) =>
          !("leadershipOnly" in l && l.leadershipOnly) ||
          session?.user.accountType === "LEADERSHIP",
      ),
    [session?.user.accountType],
  );
  const closeMenu = () => setMenuOpen(false);

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
          <nav className="desktop-nav portal-nav" aria-label="Menu portal perusahaan">
            {links.map((l) => (
              <PortalNavItem
                key={l.href}
                l={l}
                pathname={pathname}
                statusLoading={statusLoading}
                companyActive={isActive}
              />
            ))}
          </nav>
          <div className="header-actions portal-header-actions">
            <HeaderAuthLink lang={lang} />
            <button
              type="button"
              className="mobile-toggle"
              aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menuOpen ? (
          <nav className="mobile-nav portal-mobile-nav" aria-label="Menu portal perusahaan">
            {links.map((l) => (
              <PortalNavItem
                key={l.href}
                l={l}
                pathname={pathname}
                statusLoading={statusLoading}
                companyActive={isActive}
                onNavigate={closeMenu}
              />
            ))}
            <HeaderAuthLink
              lang={lang}
              onNavigate={closeMenu}
              className="mobile-nav-auth"
            />
          </nav>
        ) : null}
      </header>
      <main className="explore-main">
        <div className="container explore-layout explore-layout-portal">
          {children}
        </div>
      </main>
    </div>
  );
}
