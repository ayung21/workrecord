"use client";

import { useState } from "react";
import Link from "@/components/app-link";
import { Download, ExternalLink, Loader2, QrCode } from "lucide-react";
import type { MemberCertificateInfo } from "@/lib/api/company-portal";
import { CompanyMemberCertificate } from "@/components/company/company-member-certificate";
import { MemberCertificateQr } from "@/components/company/member-certificate-qr";
import { formatApiErrorMessage } from "@/lib/api/client";
import { downloadMemberCertificatePdf } from "@/lib/member-certificate/generate-certificate-pdf";
import {
  memberCertificatePageUrl,
  memberVerifyPageUrl,
} from "@/lib/member-certificate/urls";

type Props = {
  companyName: string;
  certificate: MemberCertificateInfo;
};

export function CompanyMemberCertificateSection({
  companyName,
  certificate,
}: Props) {
  const verifyUrl = memberVerifyPageUrl(certificate.verifyToken);
  const certUrl = memberCertificatePageUrl(certificate.verifyToken);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const onDownloadPdf = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const slug = companyName
        .replace(/[^\w\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 40);
      await downloadMemberCertificatePdf({
        companyName,
        memberId: certificate.memberId,
        verifyToken: certificate.verifyToken,
        fileName: `WorkRecord-Member-${certificate.memberId}${slug ? `-${slug}` : ""}.pdf`,
      });
    } catch (err) {
      setDownloadError(formatApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section
      className="company-member-cert-section"
      aria-labelledby="company-member-cert-title"
    >
      <div className="company-member-cert-intro">
        <h2 id="company-member-cert-title">Sertifikat member</h2>
        <p>
          Unduh sertifikat resmi dan bagikan QR untuk verifikasi keanggotaan
          perusahaan Anda.
        </p>
      </div>

      <div className="company-member-cert-grid">
        <div className="company-member-cert-qr-card">
          <div className="company-member-cert-qr-head">
            <QrCode size={20} aria-hidden />
            <span>QR verifikasi</span>
          </div>
          <MemberCertificateQr value={verifyUrl} size={140} />
          <p className="company-member-cert-qr-hint">
            Scan membuka halaman verifikasi publik WorkRecord.
          </p>
          <Link
            href={verifyUrl}
            className="company-member-cert-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buka halaman verifikasi
            <ExternalLink size={14} aria-hidden />
          </Link>
        </div>

        <div className="company-member-cert-actions">
          <p>
            Member ID: <strong>{certificate.memberId}</strong>
          </p>
          <button
            type="button"
            className="button company-member-cert-download"
            onClick={() => void onDownloadPdf()}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="animate-spin" size={18} aria-hidden />
            ) : (
              <Download size={18} aria-hidden />
            )}
            {downloading ? "Menyiapkan PDF…" : "Unduh PDF sertifikat"}
          </button>
          {downloadError ? (
            <p className="company-member-cert-download-error" role="alert">
              {downloadError}
            </p>
          ) : null}
          <Link
            href={certUrl}
            className="button button-outline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pratinjau sertifikat
          </Link>
        </div>
      </div>

      <details className="company-member-cert-preview">
        <summary>Pratinjau desain sertifikat</summary>
        <CompanyMemberCertificate
          companyName={companyName}
          certificate={certificate}
        />
      </details>
    </section>
  );
}
