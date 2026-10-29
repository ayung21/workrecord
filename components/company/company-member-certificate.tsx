"use client";

import { forwardRef } from "react";
import Image from "next/image";
import { BarChart3, ShieldCheck, Users } from "lucide-react";
import type { CompanyVerification } from "@/lib/api/company-portal";
import { MemberCertificateQr } from "@/components/company/member-certificate-qr";
import { memberVerifyPageUrl } from "@/lib/member-certificate/urls";

type CertificateData = NonNullable<CompanyVerification["memberCertificate"]>;

type Props = {
  companyName: string;
  certificate: CertificateData;
  variant?: "card" | "print";
};

const BENEFITS = [
  { icon: Users, label: "Riwayat Kerja Terverifikasi" },
  { icon: ShieldCheck, label: "Data Lebih Akurat" },
  { icon: BarChart3, label: "Rekrutmen Lebih Profesional" },
] as const;

function CertificateBenefits({ className }: { className?: string }) {
  return (
    <div className={className} aria-label="Keunggulan member">
      {BENEFITS.map(({ icon: Icon, label }) => (
        <div key={label} className="member-cert-benefit">
          <span className="member-cert-benefit-icon" aria-hidden>
            <Icon size={22} strokeWidth={2} />
          </span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

/** Layout lebar tetap untuk pratinjau & unduh PDF. */
export const MemberCertificateSheet = forwardRef<
  HTMLElement,
  {
    companyName: string;
    certificate: CertificateData;
    verifyUrl: string;
  }
>(function MemberCertificateSheet(
  { companyName, certificate, verifyUrl },
  ref,
) {
  return (
    <article
      ref={ref}
      className="member-cert-sheet"
      aria-label="Sertifikat member WorkRecord"
    >
      <header className="member-cert-sheet-header">
        <img
          src="/brand/logo.png"
          alt="WorkRecord"
          width={180}
          height={58}
          className="member-cert-sheet-logo"
        />
        <p className="member-cert-sheet-tagline">Track • Manage • Grow</p>
      </header>

      <div className="member-cert-sheet-rule" aria-hidden />

      <h1 className="member-cert-sheet-title">
        MEMBER{" "}
        <span className="member-cert-sheet-title-accent">
          COMPANY
          <span className="member-cert-sheet-title-underline" aria-hidden />
        </span>
      </h1>

      <div className="member-cert-sheet-cols">
        <div className="member-cert-sheet-main">
          <p className="member-cert-sheet-lead">
            Perusahaan ini menggunakan <strong>WorkRecord</strong> untuk
            pencatatan dan verifikasi riwayat kerja tenaga kerja.
          </p>
          <p className="member-cert-sheet-slogan">
            <span>Riwayat kerja jelas.</span>
            <span className="member-cert-sheet-slogan-accent">
              Rekrut lebih percaya diri.
            </span>
          </p>
          <div className="member-cert-sheet-qr">
            <MemberCertificateQr value={verifyUrl} size={100} />
            <div className="member-cert-sheet-qr-text">
              <p>Scan untuk verifikasi perusahaan</p>
              <p>
                Member ID : <strong>{certificate.memberId}</strong>
              </p>
            </div>
          </div>
        </div>
        <CertificateBenefits className="member-cert-sheet-benefits" />
      </div>

      <p className="member-cert-sheet-company">{companyName}</p>
      <div className="member-cert-sheet-corner" aria-hidden />
    </article>
  );
});

export const CompanyMemberCertificate = forwardRef<HTMLElement, Props>(
  function CompanyMemberCertificate(
    { companyName, certificate, variant = "card" },
    ref,
  ) {
    const verifyUrl = memberVerifyPageUrl(certificate.verifyToken);

    if (variant === "print") {
      return (
        <MemberCertificateSheet
          ref={ref}
          companyName={companyName}
          certificate={certificate}
          verifyUrl={verifyUrl}
        />
      );
    }

    return (
      <article className="member-cert" aria-label="Sertifikat member WorkRecord">
        <header className="member-cert-header">
          <div className="member-cert-brand">
            <Image
              src="/brand/logo.png"
              alt="WorkRecord"
              width={200}
              height={64}
              className="member-cert-logo"
              priority
              unoptimized
            />
            <p className="member-cert-tagline">Track • Manage • Grow</p>
          </div>
        </header>

        <div className="member-cert-divider" aria-hidden />

        <h1 className="member-cert-title">
          MEMBER{" "}
          <span className="member-cert-title-accent">
            COMPANY
            <span className="member-cert-title-underline" aria-hidden />
          </span>
        </h1>

        <div className="member-cert-body">
          <div className="member-cert-main">
            <p className="member-cert-lead">
              Perusahaan ini menggunakan <strong>WorkRecord</strong> untuk
              pencatatan dan verifikasi riwayat kerja tenaga kerja.
            </p>
            <p className="member-cert-slogan">
              <span>Riwayat kerja jelas.</span>
              <span className="member-cert-slogan-accent">
                Rekrut lebih percaya diri.
              </span>
            </p>

            <div className="member-cert-qr-row">
              <MemberCertificateQr value={verifyUrl} size={108} />
              <div className="member-cert-qr-copy">
                <p>Scan untuk verifikasi perusahaan</p>
                <p className="member-cert-member-id">
                  Member ID : <strong>{certificate.memberId}</strong>
                </p>
              </div>
            </div>
          </div>

          <CertificateBenefits className="member-cert-benefits" />
        </div>

        <p className="member-cert-company-name" aria-label="Nama perusahaan">
          {companyName}
        </p>
      </article>
    );
  },
);
