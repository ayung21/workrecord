"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchAuthMe } from "@/lib/api/auth";
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

/**
 * Blokir akses lewat URL jika belum login atau token tidak valid.
 * Redirect ke beranda marketing (halaman awal).
 */
export function RequireAuth({ children, lang = "id" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verify = () => {
      const session = readSession();
      if (!session?.accessToken) {
        setAllowed(false);
        router.replace(PUBLIC_HOME_PATH);
        return;
      }

      fetchAuthMe(session.accessToken)
        .then(() => {
          if (!cancelled) setAllowed(true);
        })
        .catch(() => {
          if (cancelled) return;
          clearSession();
          setAllowed(false);
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

  if (!allowed) {
    return (
      <p className="explore-muted">
        {lang === "id" ? "Memuat…" : "Loading…"}
      </p>
    );
  }

  return <>{children}</>;
}
