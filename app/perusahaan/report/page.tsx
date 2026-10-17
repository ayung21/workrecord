"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/components/company/portal-shell";
import { getAccessToken, readSession } from "@/lib/auth/session";
import { fetchDisputeReport } from "@/lib/api/company-portal";

export default function ReportPage() {
  const accessToken = getAccessToken();
  const companyId = readSession()?.user.companyId ?? "";
  const [data, setData] = useState<{
    totalSpent: number;
    disputes: { id: string; status: string; description: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !companyId) {
      setLoading(false);
      return;
    }
    fetchDisputeReport(companyId, accessToken)
      .then(setData)
      .finally(() => setLoading(false));
  }, [accessToken, companyId]);

  return (
    <PortalShell>
      <h1>Report sanggahan</h1>
      <p>
        Riwayat pembayaran sanggahan karyawan (bukan sanggahan terhadap perusahaan).
      </p>
      {loading ? (
        <Loader2 className="animate-spin" />
      ) : data ? (
        <>
          <p className="portal-total">
            Total dibayar: <strong>Rp {data.totalSpent.toLocaleString("id-ID")}</strong>
          </p>
          <ul className="portal-dispute-list">
            {data.disputes.map((d) => (
              <li key={d.id}>
                <span>{d.status}</span>
                <p>{d.description}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Login sebagai perusahaan untuk melihat report.</p>
      )}
    </PortalShell>
  );
}
