"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { CompanyMemberCertificate } from "@/components/company/company-member-certificate";
import {
  fetchPublicMemberVerification,
  type PublicMemberVerification,
} from "@/lib/api/member-verify";
import { formatApiErrorMessage } from "@/lib/api/client";
import { downloadMemberCertificatePdf } from "@/lib/member-certificate/generate-certificate-pdf";

function safePdfFileName(companyName: string, memberId: string) {
  const slug = companyName
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return `WorkRecord-Member-${memberId}${slug ? `-${slug}` : ""}.pdf`;
}

export default function SertifikatMemberPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const sheetRef = useRef<HTMLElement>(null);
  const [data, setData] = useState<PublicMemberVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Tautan sertifikat tidak valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPublicMemberVerification(token);
      setData(result);
    } catch (err) {
      setData(null);
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const onDownloadPdf = async () => {
    if (!data?.memberId) return;
    const el = sheetRef.current;
    if (!el) {
      setDownloadError("Sertifikat belum siap. Coba lagi.");
      return;
    }
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadMemberCertificatePdf({
        element: el,
        fileName: safePdfFileName(data.companyName, data.memberId),
      });
    } catch (err) {
      setDownloadError(formatApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="member-cert-page member-cert-page--center">
        <Loader2 className="animate-spin" size={32} aria-hidden />
        <p>Memuat sertifikat…</p>
      </div>
    );
  }

  if (error || !data || !data.memberId) {
    return (
      <div className="member-cert-page member-cert-page--center">
        <div className="member-verify-error card">
          <h1>Sertifikat tidak tersedia</h1>
          <p>{error ?? "Keanggotaan belum aktif atau data belum lengkap."}</p>
        </div>
      </div>
    );
  }

  const certificate = {
    memberId: data.memberId,
    verifyToken: data.verifyToken,
    validUntil: data.validUntil,
    joinedAt: data.joinedAt,
    lastVerifiedAt: data.lastVerifiedAt,
    domicile: data.domicile,
    canDownload: true,
  };

  return (
    <div className="member-cert-page">
      <div className="member-cert-toolbar">
        <button
          type="button"
          className="button"
          onClick={() => void onDownloadPdf()}
          disabled={downloading}
        >
          {downloading ? (
            <Loader2 className="animate-spin" size={18} aria-hidden />
          ) : (
            <Download size={18} aria-hidden />
          )}
          {downloading ? "Menyiapkan PDF…" : "Unduh PDF"}
        </button>
        {downloadError ? (
          <p className="member-cert-toolbar-error" role="alert">
            {downloadError}
          </p>
        ) : (
          <p className="member-cert-toolbar-hint">
            PDF mengikuti tampilan sertifikat di bawah.
          </p>
        )}
      </div>
      <div className="member-cert-page-frame">
        <CompanyMemberCertificate
          ref={sheetRef}
          companyName={data.companyName}
          certificate={certificate}
          variant="print"
        />
      </div>
    </div>
  );
}
