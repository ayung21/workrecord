"use client";

import Link from "@/components/app-link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAuthMe } from "@/lib/api/auth";
import { canAccessCompanyPortal, isPlatformOwner } from "@/lib/auth/roles";
import {
  AUTH_CHANGE_EVENT,
  clearSession,
  readSession,
} from "@/lib/auth/session";
import { PUBLIC_HOME_PATH } from "@/lib/auth/routes";

type Props = {
  children: React.ReactNode;
  lang?: "id" | "en";
};

const copy = {
  id: {
    ownerTitle: "Area khusus perusahaan",
    ownerBody:
      "Akun Owner platform tidak menggunakan portal perusahaan di sini. Kelola verifikasi dan operasi platform lewat panel admin.",
    companyDenied:
      "Anda belum login sebagai perusahaan. Gunakan akun Admin atau Kepemimpinan PT.",
    login: "Masuk",
    admin: "Buka panel admin",
    home: "Ke beranda",
  },
  en: {
    ownerTitle: "Company portal only",
    ownerBody:
      "Platform Owner accounts do not use the company portal here. Use the admin panel for platform operations.",
    companyDenied:
      "You are not signed in as a company user. Use a company Admin or Leadership account.",
    login: "Sign in",
    admin: "Open admin panel",
    home: "Home",
  },
};

export function CompanyPortalGuard({ children, lang = "id" }: Props) {
  const t = copy[lang];
  const router = useRouter();
  const pathname = usePathname();
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://127.0.0.1:3009";
  const [state, setState] = useState<"loading" | "allowed" | "owner" | "denied">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    const verify = () => {
      const session = readSession();
      if (!session?.accessToken) {
        setState("loading");
        router.replace(PUBLIC_HOME_PATH);
        return;
      }

      fetchAuthMe(session.accessToken)
        .then(({ user }) => {
          if (cancelled) return;
          if (isPlatformOwner(user.roleCode)) {
            setState("owner");
            return;
          }
          if (canAccessCompanyPortal(user.roleCode)) {
            setState("allowed");
            return;
          }
          setState("denied");
        })
        .catch(() => {
          if (cancelled) return;
          clearSession();
          setState("loading");
          router.replace(PUBLIC_HOME_PATH);
        });
    };

    verify();
    window.addEventListener(AUTH_CHANGE_EVENT, verify);
    window.addEventListener("storage", verify);
    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGE_EVENT, verify);
      window.removeEventListener("storage", verify);
    };
  }, [router, pathname]);

  if (state === "loading") {
    return <p className="explore-muted">{lang === "id" ? "Memuat…" : "Loading…"}</p>;
  }

  if (state === "allowed") {
    return <>{children}</>;
  }

  if (state === "owner") {
    return (
      <div className="card explore-error-block">
        <h2>{t.ownerTitle}</h2>
        <p>{t.ownerBody}</p>
        <div className="login-already">
          <a href={adminUrl} className="button button-blue">
            {t.admin}
          </a>
          <Link href="/" className="button button-ghost">
            {t.home}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card explore-error-block">
      <p>{t.companyDenied}</p>
      <div className="login-already">
        <Link href="/login?returnTo=/perusahaan" className="button button-blue">
          {t.login}
        </Link>
        <Link href={PUBLIC_HOME_PATH} className="button button-ghost">
          {t.home}
        </Link>
      </div>
    </div>
  );
}
