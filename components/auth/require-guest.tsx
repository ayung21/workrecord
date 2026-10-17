"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AUTH_CHANGE_EVENT, readSession } from "@/lib/auth/session";
import { APP_HOME_PATH } from "@/lib/auth/routes";

type Props = {
  children: React.ReactNode;
  lang?: "id" | "en";
};

/**
 * Halaman hanya untuk pengunjung belum login (mis. pendaftaran perusahaan).
 * Pengguna yang sudah masuk diarahkan ke beranda aplikasi.
 */
export function RequireGuest({ children, lang = "id" }: Props) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const verify = () => {
      const session = readSession();
      if (session?.accessToken) {
        setAllowed(false);
        router.replace(APP_HOME_PATH);
        return;
      }
      setAllowed(true);
    };

    verify();
    window.addEventListener(AUTH_CHANGE_EVENT, verify);
    window.addEventListener("storage", verify);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, verify);
      window.removeEventListener("storage", verify);
    };
  }, [router]);

  if (!allowed) {
    return (
      <p className="explore-muted auth-page-fallback">
        {lang === "id" ? "Memuat…" : "Loading…"}
      </p>
    );
  }

  return <>{children}</>;
}
