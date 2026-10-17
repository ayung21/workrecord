"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchMyCompany } from "@/lib/api/company-portal";
import { isCompanyOperational } from "@/lib/company/verification";
import { readSession } from "@/lib/auth/session";

type PortalStatus = {
  loading: boolean;
  operationalStatus: string | null;
  isActive: boolean;
  refresh: () => Promise<void>;
};

const CompanyPortalStatusContext = createContext<PortalStatus | null>(null);

const VERIFICATION_PATH = "/perusahaan/verifikasi";

export function CompanyPortalStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [operationalStatus, setOperationalStatus] = useState<string | null>(
    null,
  );

  const refresh = useCallback(async () => {
    const token = readSession()?.accessToken;
    if (!token) {
      setOperationalStatus(null);
      return;
    }
    const me = await fetchMyCompany(token);
    setOperationalStatus(me.verification?.operationalStatus ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    refresh()
      .catch(() => {
        if (!cancelled) setOperationalStatus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      loading,
      operationalStatus,
      isActive: isCompanyOperational(operationalStatus),
      refresh,
    }),
    [loading, operationalStatus, refresh],
  );

  return (
    <CompanyPortalStatusContext.Provider value={value}>
      {children}
    </CompanyPortalStatusContext.Provider>
  );
}

export function useCompanyPortalStatus() {
  const ctx = useContext(CompanyPortalStatusContext);
  if (!ctx) {
    throw new Error("useCompanyPortalStatus requires CompanyPortalStatusProvider");
  }
  return ctx;
}

/** Blokir Cari NIK / List / Report / Iklan sampai perusahaan ACTIVE. */
export function CompanyOperationalGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isActive } = useCompanyPortalStatus();

  const onVerificationRoute =
    pathname === VERIFICATION_PATH ||
    pathname.startsWith(`${VERIFICATION_PATH}/`);

  useEffect(() => {
    if (loading || isActive || onVerificationRoute) return;
    router.replace(VERIFICATION_PATH);
  }, [loading, isActive, onVerificationRoute, router]);

  if (loading) {
    return <p className="explore-muted">Memuat status perusahaan…</p>;
  }

  if (!isActive && !onVerificationRoute) {
    return <p className="explore-muted">Mengarahkan ke verifikasi dokumen…</p>;
  }

  return <>{children}</>;
}
