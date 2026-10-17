"use client";

import { format, type Locale } from "date-fns";
import { id as localeId, enUS } from "date-fns/locale";
import {
  AlertTriangle,
  Check,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import type { EmployeeRecordView } from "@/lib/api/records";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export type VerificationModalCopy = {
  modalTitle: string;
  searching: string;
  blurredHint: string;
  present: string;
  verified: string;
  workRecordId: string;
  nik: string;
  birthDate: string;
  historyCount: string;
  historyCountSuffix: string;
  employmentHistory: string;
  companyVerified: string;
  role: string;
  startDate: string;
  endDate: string;
  status: string;
  statusActive: string;
  statusEnded: string;
  note: string;
  recordStatus: string;
  recordVerified: string;
  employeeDispute: string;
  disputeYes: string;
  disputeNo: string;
  disputeBody: string;
  disputeHidden: string;
  disputeClarify: string;
  contactCompany: string;
  notAvailable: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  detail: EmployeeRecordView | null;
  anchor: EmployeeRecordView | null;
  allRecords: EmployeeRecordView[];
  companyPhone?: string | null;
  lang: "id" | "en";
  copy: VerificationModalCopy;
};

function workRecordId(recordId: string): string {
  const hex = recordId.replace(/-/g, "").slice(0, 8);
  const num = parseInt(hex, 16) % 100_000_000;
  return `WR-${String(num).padStart(8, "0")}`;
}

function maskNik(value: string | null | undefined, blurred: boolean): string {
  if (!value) return "—";
  if (blurred) {
    const digits = value.replace(/\D/g, "");
    if (digits.length < 4) return "••••";
    return `${digits.slice(0, 4)}••••••••${digits.slice(-4)}`;
  }
  return value;
}

function formatEmploymentDate(
  value: string | null | undefined,
  locale: Locale,
  blurred: boolean,
): string {
  if (!value) return "—";
  if (blurred) return "•• •••• ••••";
  try {
    return format(new Date(value), "d MMMM yyyy", { locale });
  } catch {
    return "—";
  }
}

function relatedEmployments(
  all: EmployeeRecordView[],
  anchor: EmployeeRecordView,
): EmployeeRecordView[] {
  if (anchor.employeeProfileId) {
    return all.filter(
      (r) => r.employeeProfileId === anchor.employeeProfileId,
    );
  }
  const idNumber = anchor.employeeIdNumber?.trim();
  if (idNumber) {
    return all.filter((r) => r.employeeIdNumber?.trim() === idNumber);
  }
  const name = anchor.employeeName.trim().toLowerCase();
  return all.filter((r) => r.employeeName.trim().toLowerCase() === name);
}

function formatBirthDate(
  value: string | null | undefined,
  locale: Locale,
  blurred: boolean,
  notAvailable: string,
): string {
  if (!value) return blurred ? "••/••/••••" : notAvailable;
  if (value.includes("•")) return value;
  try {
    if (blurred) {
      return `••/••/${new Date(value).getFullYear()}`;
    }
    return format(new Date(value), "d MMMM yyyy", { locale });
  } catch {
    return notAvailable;
  }
}

function formatBirthPlaceDate(
  place: string | null | undefined,
  date: string | null | undefined,
  locale: Locale,
  blurred: boolean,
  notAvailable: string,
): string {
  const datePart = formatBirthDate(date, locale, blurred, notAvailable);
  if (blurred) return datePart;
  const city = place?.trim();
  if (city && datePart !== notAvailable) return `${city}, ${datePart}`;
  if (city) return city;
  return datePart;
}

function mergeEmployment(
  row: EmployeeRecordView,
  detail: EmployeeRecordView | null,
): EmployeeRecordView {
  if (detail && row.id === detail.id) return detail;
  return row;
}

export function VerificationRecordModal({
  open,
  onOpenChange,
  loading,
  detail,
  anchor,
  allRecords,
  companyPhone,
  lang,
  copy,
}: Props) {
  const locale = lang === "id" ? localeId : enUS;
  const employments =
    anchor ? relatedEmployments(allRecords, anchor) : [];

  const primary = detail ?? anchor;
  const blurred = primary?.visibility === "blurred";
  const workRecordPublicId =
    primary?.publicWorkRecordId ??
    (primary ? workRecordId(primary.id) : "—");
  const registeredCompanies =
    primary?.registeredCompanyCount ?? employments.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="verification-modal max-h-[90dvh] overflow-y-auto rounded-2xl border-[#e4ebf5] p-0 sm:max-w-2xl"
      >
        {loading || !primary || !anchor ? (
          <>
            <DialogTitle className="sr-only">{copy.searching}</DialogTitle>
            <div className="verification-modal-loading">
              <Loader2 className="animate-spin" size={32} />
            </div>
          </>
        ) : (
          <>
            <div className="verification-modal-header">
              <DialogTitle className="verification-modal-title">
                {copy.modalTitle}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {primary.employeeName}
              </DialogDescription>
            </div>

            <div className="verification-modal-body">
              <section className="verification-identity-card">
                <div className="verification-identity-top">
                  <h2>{primary.employeeName}</h2>
                  {!blurred && (
                    <span className="verification-pill verification-pill-ok">
                      <Check size={14} strokeWidth={3} />
                      {copy.verified}
                    </span>
                  )}
                </div>
                <dl className="verification-kv">
                  <div>
                    <dt>{copy.workRecordId}</dt>
                    <dd>{workRecordPublicId}</dd>
                  </div>
                  <div>
                    <dt>{copy.nik}</dt>
                    <dd>
                      {maskNik(primary.employeeIdNumber, blurred)}
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.birthDate}</dt>
                    <dd>
                      {formatBirthPlaceDate(
                        primary.placeOfBirth,
                        primary.dateOfBirth,
                        locale,
                        blurred,
                        copy.notAvailable,
                      )}
                    </dd>
                  </div>
                  <div className="verification-kv-wide">
                    <dt>{copy.historyCount}</dt>
                    <dd>
                      {registeredCompanies} {copy.historyCountSuffix}
                    </dd>
                  </div>
                </dl>
              </section>

              {blurred && (
                <p className="verification-blur-hint">{copy.blurredHint}</p>
              )}

              <h3 className="verification-section-label">
                {copy.employmentHistory}
              </h3>

              <div className="verification-employment-list">
                {employments.map((row) => {
                  const item = mergeEmployment(row, detail);
                  const itemBlurred = item.visibility === "blurred";
                  const ended = Boolean(item.leftAt);
                  const hasDispute =
                    !itemBlurred && Boolean(item.hasEmployeeDispute);

                  return (
                    <article
                      key={item.id}
                      className="verification-employment-card"
                    >
                      <div className="verification-employment-top">
                        <h4>{item.companyName ?? "—"}</h4>
                        {!itemBlurred && (
                          <span className="verification-pill verification-pill-ok">
                            <ShieldCheck size={13} />
                            {copy.companyVerified}
                          </span>
                        )}
                      </div>

                      <dl className="verification-employment-fields">
                        <div>
                          <dt>{copy.role}</dt>
                          <dd>{itemBlurred ? "***" : item.position ?? "—"}</dd>
                        </div>
                        <div>
                          <dt>{copy.startDate}</dt>
                          <dd>
                            {formatEmploymentDate(
                              item.joinedAt,
                              locale,
                              itemBlurred,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>{copy.endDate}</dt>
                          <dd>
                            {item.leftAt
                              ? formatEmploymentDate(
                                  item.leftAt,
                                  locale,
                                  itemBlurred,
                                )
                              : copy.present}
                          </dd>
                        </div>
                        <div>
                          <dt>{copy.status}</dt>
                          <dd>
                            {ended ? copy.statusEnded : copy.statusActive}
                          </dd>
                        </div>
                      </dl>

                      <div className="verification-subsection">
                        <p className="verification-subsection-label">
                          {copy.recordStatus}
                        </p>
                        {!itemBlurred ? (
                          <p className="verification-subsection-ok">
                            <Check size={15} strokeWidth={2.5} />
                            {copy.recordVerified}
                          </p>
                        ) : (
                          <p className="verification-subsection-muted">—</p>
                        )}
                      </div>

                      <div className="verification-subsection">
                        <p className="verification-subsection-label">
                          {copy.employeeDispute}
                        </p>
                        <p
                          className={
                            hasDispute
                              ? "verification-dispute-flag"
                              : "verification-subsection-muted"
                          }
                        >
                          {hasDispute ? (
                            <>
                              <AlertTriangle size={15} />
                              {copy.disputeYes}
                            </>
                          ) : (
                            copy.disputeNo
                          )}
                        </p>
                        {hasDispute && (
                          <div className="verification-dispute-box">
                            <p>{copy.disputeBody}</p>
                            <p>{copy.disputeHidden}</p>
                            <p>{copy.disputeClarify}</p>
                          </div>
                        )}
                      </div>

                      {companyPhone && item.id === anchor.id && !itemBlurred && (
                        <a
                          className="verification-contact-btn"
                          href={`tel:${companyPhone.replace(/\s/g, "")}`}
                        >
                          {copy.contactCompany}
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
