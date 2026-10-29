"use client";

import { ShieldAlert } from "lucide-react";
import type {
  DisputingCompanyRef,
  EmployeeRecordView,
} from "@/lib/api/records";
import { formatDisputingCompanyDisplay } from "@/lib/company/disputing-company-display";
import { EmployeeRecordPhoto } from "@/components/company/employee-record-photo";

function fmtDate(v: string | null | undefined) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPeriod(joinedAt?: string | null, leftAt?: string | null) {
  const start = joinedAt ? fmtDate(joinedAt) : "—";
  const end = leftAt ? fmtDate(leftAt) : "Sekarang";
  return `${start} — ${end}`;
}

type Props = {
  items: EmployeeRecordView[];
  disputingCompanies?: DisputingCompanyRef[];
  token: string;
};

/** Tampilan hasil cari NIK — detail profil + riwayat per perusahaan. */
export function NikSearchResult({
  items,
  disputingCompanies = [],
  token,
}: Props) {
  if (!items.length) return null;

  const profile = items[0];
  const photoRecord = items.find(
    (r) => r.hasPhoto && r.companyId && r.id,
  );

  const disputingNames =
    disputingCompanies.length > 0
      ? disputingCompanies.map((c) =>
          formatDisputingCompanyDisplay(c.companyName, c.companyPhone),
        )
      : [
          ...new Set(
            items
              .filter((r) => r.disputedByEmployer && r.disputedByCompanyName)
              .map((r) =>
                formatDisputingCompanyDisplay(
                  r.disputedByCompanyName as string,
                  r.disputedByCompanyPhone,
                ),
              ),
          ),
        ];

  const showOwnDisputeNote =
    profile.hasBlacklist &&
    profile.blacklistedByViewerCompany &&
    Boolean(profile.blacklistNote?.trim());

  const hasDispute = profile.hasBlacklist || disputingNames.length > 0;

  return (
    <div className="nik-search-result">
      <section className="nik-search-profile card explore-card">
        <div className="portal-detail-layout">
          <div className="nik-search-photo">
            {photoRecord?.companyId ? (
              <EmployeeRecordPhoto
                companyId={photoRecord.companyId}
                recordId={photoRecord.id}
                token={token}
                size="detail"
              />
            ) : (
              <p className="explore-muted">Foto tidak tersedia</p>
            )}
          </div>
          <div>
            <h2 className="nik-search-name">{profile.employeeName}</h2>
            <dl className="portal-detail-grid nik-search-identity">
              <div>
                <dt>NIK KTP</dt>
                <dd>{profile.nationalIdNumber ?? "—"}</dd>
              </div>
              <div>
                <dt>WorkRecord ID</dt>
                <dd>{profile.publicWorkRecordId ?? "—"}</dd>
              </div>
              <div>
                <dt>Tempat lahir</dt>
                <dd>{profile.placeOfBirth?.trim() || "—"}</dd>
              </div>
              <div>
                <dt>Tanggal lahir</dt>
                <dd>{fmtDate(profile.dateOfBirth)}</dd>
              </div>
              <div>
                <dt>Perusahaan terdaftar</dt>
                <dd>
                  {profile.registeredCompanyCount ?? items.length}{" "}
                  {(profile.registeredCompanyCount ?? items.length) === 1
                    ? "perusahaan"
                    : "perusahaan"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {hasDispute ? (
          <div
            className={`nik-search-dispute${showOwnDisputeNote ? " nik-search-dispute-own" : ""}`}
            role="status"
          >
            <ShieldAlert size={20} aria-hidden />
            <div>
              <strong>Status sanggahan</strong>
              {disputingNames.length > 0 ? (
                <p>
                  Pekerja ini disanggahkan oleh:{" "}
                  <strong>{disputingNames.join(", ")}</strong>.
                </p>
              ) : (
                <p>
                  Terdapat sanggahan terhadap informasi pada profil pekerja ini.
                </p>
              )}
              {showOwnDisputeNote ? (
                <p className="nik-search-dispute-note">
                  <span>Alasan sanggahan (perusahaan Anda):</span>
                  {profile.blacklistNote}
                </p>
              ) : (
                <p className="explore-muted">
                  Alasan sanggahan hanya dapat dilihat oleh perusahaan yang
                  mengajukan sanggahan, tidak ditampilkan kepada perusahaan lain.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <h3 className="nik-search-history-title">Riwayat kerja per perusahaan</h3>
      <ul className="nik-search-history">
        {items.map((r) => (
          <li key={r.id}>
            <article className="explore-card nik-search-record">
              <header className="nik-search-record-head">
                <div>
                  <h4>{r.companyName ?? "Perusahaan"}</h4>
                  <p className="explore-muted">{r.position?.trim() || "—"}</p>
                  {r.disputedByEmployer && r.disputedByCompanyName ? (
                    <p className="nik-search-record-dispute">
                      Disanggahkan oleh{" "}
                      <strong>
                        {formatDisputingCompanyDisplay(
                          r.disputedByCompanyName,
                          r.disputedByCompanyPhone,
                        )}
                      </strong>
                    </p>
                  ) : null}
                </div>
                {r.hasPhoto && r.companyId ? (
                  <EmployeeRecordPhoto
                    companyId={r.companyId}
                    recordId={r.id}
                    token={token}
                    size="thumb"
                  />
                ) : null}
              </header>
              <dl className="portal-detail-grid">
                <div>
                  <dt>Periode</dt>
                  <dd>{formatPeriod(r.joinedAt, r.leftAt)}</dd>
                </div>
                <div>
                  <dt>ID karyawan internal</dt>
                  <dd>{r.employeeIdNumber?.trim() || "—"}</dd>
                </div>
                {r.violationNotes?.trim() ? (
                  <div className="nik-search-field-wide">
                    <dt>Catatan pelanggaran</dt>
                    <dd>{r.violationNotes}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
