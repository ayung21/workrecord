"use client";

import Link from "@/components/app-link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import {
  AUTH_CHANGE_EVENT,
  clearSession,
  readSession,
  type AuthSession,
} from "@/lib/auth/session";
import { loginRoleSubtitle } from "@/lib/auth/account-display";
import { isPlatformOwner } from "@/lib/auth/roles";
import { PUBLIC_HOME_PATH } from "@/lib/auth/routes";
import { fetchMyCompany } from "@/lib/api/company-portal";

type Props = {
  lang: "id" | "en";
  onNavigate?: () => void;
  className?: string;
};

const labels = {
  id: { login: "Masuk", register: "Daftar", logout: "Keluar", account: "Akun" },
  en: { login: "Sign in", register: "Register", logout: "Sign out", account: "Account" },
};

export function HeaderAuthLink({ lang, onNavigate, className }: Props) {
  const t = labels[lang];
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const loginHref =
    pathname && pathname !== "/login"
      ? `/login?returnTo=${encodeURIComponent(pathname)}`
      : "/login";

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener(AUTH_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    const user = session?.user;
    const token = session?.accessToken;
    if (!user?.companyId || !token) {
      setCompanyName(null);
      return;
    }
    let cancelled = false;
    fetchMyCompany(token)
      .then((me) => {
        if (!cancelled) setCompanyName(me.name?.trim() || null);
      })
      .catch(() => {
        if (!cancelled) setCompanyName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, session?.user?.companyId]);

  const onRegisterPage =
    pathname === "/daftar" || pathname?.startsWith("/daftar/");

  if (session?.user) {
    const label =
      session.user.email?.trim() ||
      session.user.publicLoginId ||
      t.account;
    const adminUrl =
      process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://127.0.0.1:3009";
    const roleLine = loginRoleSubtitle(session.user, lang);

    return (
      <div className={`header-auth session ${className ?? ""}`}>
        <div className="header-auth-identity">
          <span className="header-auth-email" title={label}>
            {label}
          </span>
          {roleLine ? (
            <span className="header-auth-role">{roleLine}</span>
          ) : null}
          {companyName ? (
            <span className="header-auth-company" title={companyName}>
              {companyName}
            </span>
          ) : null}
        </div>
        {isPlatformOwner(session.user.roleCode) && (
          <a
            href={adminUrl}
            className="header-auth-register"
            title="Panel admin Owner"
          >
            Admin
          </a>
        )}
        <button
          type="button"
          className="header-auth-logout"
          onClick={() => {
            clearSession();
            onNavigate?.();
            router.replace(PUBLIC_HOME_PATH);
          }}
        >
          <LogOut size={15} />
          {t.logout}
        </button>
      </div>
    );
  }

  return (
    <div className={`header-auth-guest ${className ?? ""}`}>
      {!onRegisterPage && (
        <Link
          href="/daftar"
          className="header-auth-register"
          onClick={() => onNavigate?.()}
        >
          {t.register}
        </Link>
      )}
      <Link
        href={loginHref}
        className="header-auth-login"
        onClick={() => onNavigate?.()}
      >
        {t.login}
      </Link>
    </div>
  );
}
