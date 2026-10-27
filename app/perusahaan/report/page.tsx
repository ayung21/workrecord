"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PortalShell } from "@/components/company/portal-shell";
import { getAccessToken, readSession } from "@/lib/auth/session";
import {
  DisputeReport,
  fetchDisputeReport,
} from "@/lib/api/company-portal";

function formatIdr(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function sanggahanStatusLabel(status: string) {
  if (status === "ACTIVE") return "Aktif";
  if (status === "CANCELLED") return "Dibatalkan";
  return status;
}

function paymentStatusLabel(status: string | null) {
  if (!status) return "—";
  if (status === "PAID") return "Lunas";
  if (status === "PENDING") return "Menunggu bayar";
  if (status === "FAILED") return "Gagal";
  if (status === "EXPIRED") return "Kedaluwarsa";
  if (status === "REFUNDED") return "Dikembalikan";
  return status;
}

export default function ReportPage() {
  const accessToken = getAccessToken();
  const companyId = readSession()?.user.companyId ?? "";
  const [data, setData] = useState<DisputeReport | null>(null);
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

  const totalSanggahan =
    data?.totalSanggahan ?? data?.disputes.length ?? 0;
  const activeSanggahan =
    data?.activeSanggahan ??
    data?.disputes.filter((d) => d.status === "ACTIVE").length ??
    0;

  return (
    <PortalShell>
      <h1>Report sanggahan</h1>
      <p>
        Riwayat pembayaran sanggahan karyawan (bukan sanggahan terhadap
        perusahaan).
      </p>
      {loading ? (
        <div className="portal-table-loading">
          <Loader2 className="animate-spin" size={28} aria-hidden />
          <span>Memuat report…</span>
        </div>
      ) : data ? (
        <>
          <div className="portal-report-summary">
            <div className="portal-report-stat">
              <span className="portal-report-stat-label">Total sanggahan</span>
              <strong className="portal-report-stat-value">
                {totalSanggahan}
              </strong>
              <span className="portal-report-stat-hint">
                {activeSanggahan} sedang aktif
              </span>
            </div>
            <div className="portal-report-stat portal-report-stat--accent">
              <span className="portal-report-stat-label">Total uang keluar</span>
              <strong className="portal-report-stat-value">
                {formatIdr(data.totalSpent)}
              </strong>
              <span className="portal-report-stat-hint">
                Hanya pembayaran berstatus lunas
              </span>
            </div>
          </div>

          <div className="portal-table-section">
            <div className="portal-table-section-head">
              <h2>Daftar karyawan disanggahkan</h2>
            </div>
            <div className="portal-table-wrap">
              <table className="portal-table portal-table-employees portal-table-report">
                <thead>
                  <tr>
                    <th scope="col">Nama</th>
                    <th scope="col">NIK</th>
                    <th scope="col">Posisi</th>
                    <th scope="col">Status sanggahan</th>
                    <th scope="col">Pembayaran</th>
                    <th scope="col">Biaya</th>
                    <th scope="col">Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.disputes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="portal-table-empty">
                        Belum ada riwayat sanggahan berbayar.
                      </td>
                    </tr>
                  ) : (
                    data.disputes.map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span className="portal-table-name">
                            {d.employeeName?.trim() || "—"}
                          </span>
                        </td>
                        <td className="portal-table-mono">
                          {d.nationalIdNumber || "—"}
                        </td>
                        <td>{d.position?.trim() || "—"}</td>
                        <td>
                          <span
                            className={
                              d.status === "ACTIVE"
                                ? "portal-badge portal-badge-blacklist"
                                : "portal-badge portal-badge-muted"
                            }
                          >
                            {sanggahanStatusLabel(d.status)}
                          </span>
                        </td>
                        <td>{paymentStatusLabel(d.paymentStatus)}</td>
                        <td className="portal-table-mono">
                          {(d.amountIdr ?? 0) > 0
                            ? formatIdr(d.amountIdr)
                            : "—"}
                        </td>
                        <td className="portal-table-muted">
                          {d.createdAt
                            ? new Date(d.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p>Login sebagai perusahaan untuk melihat report.</p>
      )}
    </PortalShell>
  );
}
