"use client";

import Image from "next/image";
import Link from "@/components/app-link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileBadge2,
  Info,
  RefreshCw,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { PublicMemberVerification } from "@/lib/api/member-verify";
import { formatDateId } from "@/lib/format/display-date";
import {
  memberCertificatePageUrl,
  memberVerifyPageUrl,
} from "@/lib/member-certificate/urls";

type Props = {
  data: PublicMemberVerification;
  onRefresh?: () => void;
  refreshing?: boolean;
};

const BENEFITS = [
  { icon: Users, label: "Riwayat Kerja Terverifikasi" },
  { icon: ShieldCheck, label: "Data Lebih Akurat" },
  { icon: BarChart3, label: "Rekrutmen Lebih Profesional" },
] as const;

export function MemberVerifyPublicView({
  data,
  onRefresh,
  refreshing,
}: Props) {
  const isActive =
    data.membershipStatus === "ACTIVE" && data.verificationStatus === "VERIFIED";
  const certUrl = memberCertificatePageUrl(data.verifyToken);
  const verifyUrl = memberVerifyPageUrl(data.verifyToken);

  return (
    <div className="member-verify-page">
      <header className="member-verify-header">
        <Link href="/" className="member-verify-brand">
          <Image
            src="/brand/logo.png"
            alt="WorkRecord"
            width={180}
            height={56}
            priority
          />
        </Link>
        <h1 className="member-verify-title">
          Verifikasi Keanggotaan Perusahaan
        </h1>
      </header>

      {isActive ? (
        <div className="member-verify-banner member-verify-banner--ok" role="status">
          <CheckCircle2 size={22} strokeWidth={2} aria-hidden />
          <div>
            <strong>MEMBER AKTIF &amp; TERVERIFIKASI</strong>
            <p>
              Perusahaan berikut terdaftar sebagai anggota aktif WorkRecord dan
              telah diverifikasi.
            </p>
          </div>
        </div>
      ) : (
        <div className="member-verify-banner member-verify-banner--warn" role="status">
          <Info size={22} strokeWidth={2} aria-hidden />
          <div>
            <strong>STATUS KEANGGOTAAN TIDAK AKTIF</strong>
            <p>Hubungi perusahaan atau dukungan WorkRecord untuk informasi.</p>
          </div>
        </div>
      )}

      <section className="member-verify-card" aria-labelledby="member-verify-identity">
        <h2 id="member-verify-identity">Identitas Perusahaan</h2>
        <dl className="member-verify-kv">
          <div>
            <dt>Nama Perusahaan</dt>
            <dd>{data.companyName}</dd>
          </div>
          <div>
            <dt>Member ID</dt>
            <dd>{data.memberId ?? "—"}</dd>
          </div>
          <div>
            <dt>Status Keanggotaan</dt>
            <dd>
              <span
                className={
                  data.membershipStatus === "ACTIVE"
                    ? "member-verify-dot member-verify-dot--ok"
                    : "member-verify-dot member-verify-dot--warn"
                }
              >
                {data.membershipStatus === "ACTIVE" ? "Aktif" : "Tidak aktif"}
              </span>
            </dd>
          </div>
          <div>
            <dt>Status Verifikasi</dt>
            <dd>
              <span className="member-verify-dot member-verify-dot--ok">
                Terverifikasi
              </span>
            </dd>
          </div>
          <div>
            <dt>Kategori Member</dt>
            <dd>{data.memberCategory}</dd>
          </div>
          <div>
            <dt>Bidang Usaha</dt>
            <dd>{data.businessField ?? "—"}</dd>
          </div>
          <div>
            <dt>Domisili</dt>
            <dd>{data.domicile ?? "—"}</dd>
          </div>
          <div>
            <dt>Bergabung Sejak</dt>
            <dd>{formatDateId(data.joinedAt)}</dd>
          </div>
          <div className="member-verify-kv-wide">
            <dt>Terakhir Diverifikasi</dt>
            <dd>{formatDateId(data.lastVerifiedAt)}</dd>
          </div>
        </dl>
      </section>

      <section className="member-verify-benefits-row" aria-label="Keunggulan member">
        {BENEFITS.map(({ icon: Icon, label }) => (
          <div key={label} className="member-verify-benefit-chip">
            <Icon size={20} strokeWidth={2} aria-hidden />
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="member-verify-info">
        <Info size={18} strokeWidth={2} aria-hidden />
        <div>
          <h3>Informasi Layanan</h3>
          <ul>
            <li>
              Perusahaan menggunakan WorkRecord untuk pencatatan riwayat kerja.
            </li>
            <li>
              Mendukung verifikasi data tenaga kerja secara lebih terstruktur.
            </li>
            <li>Membantu proses rekrutmen yang lebih profesional.</li>
          </ul>
        </div>
      </section>

      <div className="member-verify-actions">
        <Link href={certUrl} className="member-verify-btn member-verify-btn--primary">
          <FileBadge2 size={18} strokeWidth={2} aria-hidden />
          Lihat Sertifikat Member
          <ArrowRight size={18} aria-hidden />
        </Link>
        <button
          type="button"
          className="member-verify-btn member-verify-btn--secondary"
          onClick={() => onRefresh?.()}
          disabled={refreshing}
        >
          <RefreshCw
            size={18}
            strokeWidth={2}
            aria-hidden
            className={refreshing ? "animate-spin" : undefined}
          />
          Verifikasi Ulang
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>

      <footer className="member-verify-footer">
        <p className="member-verify-footer-slogan">
          Riwayat kerja jelas. Rekrut lebih percaya diri.
        </p>
        <p className="member-verify-footer-copy">
          © {new Date().getFullYear()} WorkRecord
        </p>
        <p className="member-verify-footer-url">{verifyUrl}</p>
      </footer>
    </div>
  );
}
