"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock,
  FileUp,
  IdCard,
  Loader2,
  MapPin,
  ScrollText,
  ShieldCheck,
  Upload,
  Video,
} from "lucide-react";
import type { CompanyVerification } from "@/lib/api/company-portal";
import { companyDocumentAcceptAttr } from "@/lib/company/document-upload";
import { PORTAL_LOCKED_MESSAGE } from "@/lib/company/verification";

const DOC_META: Record<
  string,
  { label: string; hint: string; icon: typeof Building2 }
> = {
  NIB: {
    label: "NIB",
    hint: "Nomor Induk Berusaha — unggah file PDF (maks. jelas terbaca).",
    icon: Building2,
  },
  KTP_PENANGGUNG_JAWAB: {
    label: "KTP penanggung jawab",
    hint: "KTP direktur atau penanggung jawab yang terdaftar.",
    icon: IdCard,
  },
  AKTA: {
    label: "Akta perusahaan",
    hint: "Akta pendirian atau perubahan terakhir — format PDF saja.",
    icon: ScrollText,
  },
};

const DOC_STATUS: Record<
  string,
  { label: string; pill: string }
> = {
  MISSING: { label: "Belum diunggah", pill: "company-doc-pill-muted" },
  PENDING: { label: "Menunggu tinjauan", pill: "company-doc-pill-pending" },
  APPROVED: { label: "Disetujui", pill: "company-doc-pill-ok" },
  REJECTED: { label: "Ditolak — unggah ulang", pill: "company-doc-pill-reject" },
};

const OPS_STATUS: Record<
  string,
  { label: string; pill: string; description: string }
> = {
  PENDING_DOCUMENTS: {
    label: "Lengkapi dokumen",
    pill: "company-ops-pill-warn",
    description: "Unggah ketiga dokumen, lalu kirim untuk ditinjau tim WorkRecord.",
  },
  UNDER_REVIEW: {
    label: "Sedang ditinjau",
    pill: "company-ops-pill-pending",
    description:
      "Dokumen Anda dalam antrean verifikasi. Fitur portal terbuka setelah perusahaan diaktifkan.",
  },
  ACTIVE: {
    label: "Perusahaan aktif",
    pill: "company-ops-pill-ok",
    description:
      "Verifikasi selesai. Anda dapat menggunakan Cari NIK, List, Report, dan Iklan.",
  },
  SUSPENDED: {
    label: "Ditangguhkan",
    pill: "company-ops-pill-reject",
    description: "Hubungi dukungan WorkRecord untuk informasi lebih lanjut.",
  },
};

const STEPS = [
  { key: "upload", label: "Unggah dokumen" },
  { key: "review", label: "Tinjauan dokumen" },
  { key: "site", label: "Video / kunjungan" },
  { key: "active", label: "Perusahaan aktif" },
] as const;

const SITE_STATUS_LABEL: Record<string, string> = {
  NOT_REQUESTED: "Belum diajukan",
  AWAITING_SCHEDULE: "Menunggu jadwal dari WorkRecord",
  SCHEDULED: "Jadwal ditetapkan",
  COMPLETED: "Selesai",
};

function stepIndex(verification: CompanyVerification): number {
  if (verification.operationalStatus === "ACTIVE") return 4;
  const site = verification.siteVerification?.status ?? "NOT_REQUESTED";
  if (site === "COMPLETED") return 4;
  if (
    site === "SCHEDULED" ||
    site === "AWAITING_SCHEDULE"
  ) {
    return 3;
  }
  if (verification.operationalStatus === "UNDER_REVIEW") return 2;
  return 1;
}

type Props = {
  verification: CompanyVerification;
  busy: boolean;
  showLockedNotice: boolean;
  onUpload: (type: string, file: File) => void;
  onPreview?: (type: string) => void;
  onSubmitReview: () => void;
  onRequestSite?: (input: {
    method: "VIDEO_CALL" | "ON_SITE";
    contactName: string;
    contactPhone: string;
    address: string;
    preferredScheduleNote?: string;
  }) => void;
};

export function CompanyVerificationPanel({
  verification,
  busy,
  showLockedNotice,
  onUpload,
  onPreview,
  onSubmitReview,
  onRequestSite,
}: Props) {
  const site = verification.siteVerification;
  const [siteMethod, setSiteMethod] = useState<"VIDEO_CALL" | "ON_SITE">(
    "VIDEO_CALL",
  );
  const [siteForm, setSiteForm] = useState({
    contactName: "",
    contactPhone: "",
    address: "",
    preferredScheduleNote: "",
  });
  const ops = OPS_STATUS[verification.operationalStatus] ?? {
    label: verification.operationalStatus,
    pill: "company-ops-pill-pending",
    description: "",
  };
  const approvedCount = verification.documents.filter(
    (d) => d.status === "APPROVED",
  ).length;
  const totalDocs = verification.documents.length;
  const progressPct =
    totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;
  const currentStep = stepIndex(verification);
  const uploadsLocked = verification.operationalStatus === "ACTIVE";

  return (
    <div className="company-verify">
      {showLockedNotice && (
        <div className="portal-notice company-verify-notice" role="status">
          <ShieldCheck size={20} strokeWidth={2} aria-hidden />
          <p>{PORTAL_LOCKED_MESSAGE}</p>
        </div>
      )}

      {verification.operationalStatus === "ACTIVE" && (
        <div className="company-verify-success" role="status">
          <CheckCircle2 size={22} strokeWidth={2} aria-hidden />
          <div>
            <strong>Verifikasi berhasil</strong>
            <p>Semua layanan portal perusahaan sudah dapat digunakan.</p>
          </div>
        </div>
      )}

      <section className="company-verify-status-card" aria-labelledby="company-verify-status-title">
        <div className="company-verify-status-top">
          <div>
            <p className="company-verify-eyebrow" id="company-verify-status-title">
              Status perusahaan
            </p>
            <h2 className="company-verify-status-heading">{ops.label}</h2>
            <p className="company-verify-status-desc">{ops.description}</p>
          </div>
          <span className={`company-ops-pill ${ops.pill}`}>{ops.label}</span>
        </div>

        <div className="company-verify-progress">
          <div className="company-verify-progress-labels">
            <span>Dokumen disetujui</span>
            <span>
              <strong>{approvedCount}</strong> / {totalDocs}
            </span>
          </div>
          <div className="company-verify-progress-track" aria-hidden>
            <div
              className="company-verify-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <ol className="company-verify-steps" aria-label="Tahapan verifikasi">
          {STEPS.map((step, i) => {
            const n = i + 1;
            const done = currentStep > n;
            const active = currentStep === n;
            return (
              <li
                key={step.key}
                className={
                  done
                    ? "company-verify-step is-done"
                    : active
                      ? "company-verify-step is-active"
                      : "company-verify-step"
                }
              >
                <span className="company-verify-step-dot" aria-hidden>
                  {done ? <CheckCircle2 size={14} /> : n}
                </span>
                <span className="company-verify-step-label">{step.label}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="verification-section-label">Dokumen legal</p>
      <div className="company-doc-grid">
        {verification.documents.map((d) => {
          const meta = DOC_META[d.type] ?? {
            label: d.type,
            hint: "",
            icon: FileUp,
          };
          const Icon = meta.icon;
          const st = DOC_STATUS[d.status] ?? {
            label: d.status,
            pill: "company-doc-pill-muted",
          };
          const inputId = `company-doc-${d.type}`;

          return (
            <article key={d.type} className="company-doc-card">
              <div className="company-doc-card-head">
                <span className="company-doc-icon" aria-hidden>
                  <Icon size={22} strokeWidth={1.75} />
                </span>
                <div className="company-doc-card-main">
                  <div className="company-doc-card-row">
                    <h3>{meta.label}</h3>
                    <span className={`company-doc-pill ${st.pill}`}>
                      {st.label}
                    </span>
                  </div>
                  <p>{meta.hint}</p>
                </div>
              </div>

              {d.rejectReason && (
                <div className="company-doc-reject" role="alert">
                  <p>
                    <strong>Alasan penolakan:</strong> {d.rejectReason}
                  </p>
                </div>
              )}

              <div className="company-doc-footer">
                <p className="company-doc-file-hint">
                  {d.hasFile ? (
                    <>
                      <CheckCircle2 size={14} aria-hidden />
                      Berkas terunggah — Anda dapat mengganti sebelum disetujui.
                    </>
                  ) : (
                    <>
                      <Clock size={14} aria-hidden />
                      Belum ada berkas
                    </>
                  )}
                </p>
                <div className="company-doc-actions">
                  {d.hasFile && onPreview && (
                    <button
                      type="button"
                      className="button button-outline company-doc-preview-btn"
                      disabled={busy}
                      onClick={() => onPreview(d.type)}
                    >
                      Pratinjau berkas
                    </button>
                  )}
                <div className="company-doc-upload">
                  <input
                    id={inputId}
                    type="file"
                    className="company-doc-file-input"
                    accept={companyDocumentAcceptAttr(d.type)}
                    disabled={busy || uploadsLocked}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(d.type, f);
                      e.target.value = "";
                    }}
                  />
                  <label
                    htmlFor={inputId}
                    className={`button button-outline company-doc-upload-btn${busy || uploadsLocked ? " is-disabled" : ""}`}
                  >
                    {busy ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    {d.hasFile ? "Ganti berkas" : "Unggah berkas"}
                  </label>
                </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {verification.canSubmitForReview &&
        verification.operationalStatus === "PENDING_DOCUMENTS" && (
          <div className="company-verify-submit">
            <p>
              Semua dokumen sudah terunggah. Kirim sekali — tim WorkRecord akan
              meninjau per dokumen.
            </p>
            <button
              type="button"
              className="button button-blue"
              disabled={busy}
              onClick={onSubmitReview}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <ShieldCheck size={18} />
              )}
              Kirim untuk ditinjau WorkRecord
            </button>
          </div>
        )}

      {verification.operationalStatus === "UNDER_REVIEW" && (
        <div className="company-verify-waiting">
          <Clock size={20} aria-hidden />
          <p>
            Pengajuan sudah dikirim. Anda tidak perlu mengunggah ulang kecuali
            ada dokumen yang ditolak.
          </p>
        </div>
      )}

      <p className="verification-section-label">Verifikasi lapangan</p>
      <section className="company-site-card">
        <p className="company-site-lead">
          Setelah dokumen dikirim, pilih <strong>video call</strong> dengan tim
          WorkRecord atau <strong>kunjungan</strong> ke alamat perusahaan.
          Admin akan menjadwalkan; aktivasi portal setelah dokumen disetujui dan
          verifikasi lapangan selesai.
        </p>
        {site?.video && (
          <p className="company-site-mode-hint" role="note">
            {site.video.meetingLinkActive
              ? "Video call saat ini via link meeting (Meet/Zoom) dari admin. STUN/TURN di VPS dapat diaktifkan nanti tanpa mengubah alur dokumen."
              : site.video.webrtcReady
                ? "Server siap WebRTC (STUN/TURN). Tampilan panggilan dalam aplikasi dapat diaktifkan pada rilis berikutnya."
                : "Mode WebRTC dipilih di server tetapi STUN/TURN belum dikonfigurasi — sementara gunakan link meeting."}
          </p>
        )}

        {site && site.status !== "NOT_REQUESTED" && (
          <dl className="company-site-summary">
            <div>
              <dt>Status</dt>
              <dd>{SITE_STATUS_LABEL[site.status] ?? site.status}</dd>
            </div>
            <div>
              <dt>Metode</dt>
              <dd>
                {site.method === "VIDEO_CALL"
                  ? "Video call"
                  : site.method === "ON_SITE"
                    ? "Kunjungan lokasi"
                    : "—"}
              </dd>
            </div>
            {site.scheduledAt && (
              <div>
                <dt>Jadwal</dt>
                <dd>
                  {new Date(site.scheduledAt).toLocaleString("id-ID", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            )}
            {site.meetingUrl && site.method === "VIDEO_CALL" && (
              <div className="company-site-wide">
                <dt>Link meeting</dt>
                <dd>
                  <a
                    href={site.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="company-site-meeting-link"
                  >
                    Buka ruang video call
                  </a>
                </dd>
              </div>
            )}
            {site.adminNotes && (
              <div className="company-site-wide">
                <dt>Catatan WorkRecord</dt>
                <dd>{site.adminNotes}</dd>
              </div>
            )}
          </dl>
        )}

        {site?.canRequest && onRequestSite && (
          <form
            className="company-site-form"
            onSubmit={(e) => {
              e.preventDefault();
              onRequestSite({
                method: siteMethod,
                contactName: siteForm.contactName.trim(),
                contactPhone: siteForm.contactPhone.trim(),
                address: siteForm.address.trim(),
                preferredScheduleNote:
                  siteForm.preferredScheduleNote.trim() || undefined,
              });
            }}
          >
            <div className="company-site-method">
              <button
                type="button"
                className={
                  siteMethod === "VIDEO_CALL"
                    ? "company-site-method-btn is-on"
                    : "company-site-method-btn"
                }
                onClick={() => setSiteMethod("VIDEO_CALL")}
              >
                <Video size={18} aria-hidden />
                Video call
              </button>
              <button
                type="button"
                className={
                  siteMethod === "ON_SITE"
                    ? "company-site-method-btn is-on"
                    : "company-site-method-btn"
                }
                onClick={() => setSiteMethod("ON_SITE")}
              >
                <MapPin size={18} aria-hidden />
                Kunjungan lokasi
              </button>
            </div>
            <div className="register-grid">
              <label>
                <span>Nama penanggung jawab</span>
                <input
                  value={siteForm.contactName}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, contactName: e.target.value }))
                  }
                  required
                  minLength={2}
                />
              </label>
              <label>
                <span>Telepon / WhatsApp</span>
                <input
                  value={siteForm.contactPhone}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, contactPhone: e.target.value }))
                  }
                  required
                  minLength={8}
                />
              </label>
              <label className="register-full">
                <span>
                  {siteMethod === "ON_SITE"
                    ? "Alamat lengkap perusahaan"
                    : "Alamat perusahaan (verifikasi data)"}
                </span>
                <input
                  value={siteForm.address}
                  onChange={(e) =>
                    setSiteForm((f) => ({ ...f, address: e.target.value }))
                  }
                  required
                  minLength={10}
                />
              </label>
              <label className="register-full">
                <span>Preferensi jadwal (opsional)</span>
                <input
                  value={siteForm.preferredScheduleNote}
                  onChange={(e) =>
                    setSiteForm((f) => ({
                      ...f,
                      preferredScheduleNote: e.target.value,
                    }))
                  }
                  placeholder="Contoh: Senin–Jumat 09.00–15.00 WIB"
                />
              </label>
            </div>
            <button
              type="submit"
              className="button button-blue"
              disabled={busy}
            >
              Kirim permintaan verifikasi lapangan
            </button>
          </form>
        )}

        {site?.status === "AWAITING_SCHEDULE" && (
          <p className="company-site-muted">
            Permintaan diterima. Tim WorkRecord akan menghubungi Anda untuk
            menetapkan jadwal.
          </p>
        )}
      </section>
    </div>
  );
}
