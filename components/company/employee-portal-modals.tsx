"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { EmployeeChangeRequest, UpdateEmployeeInput } from "@/lib/api/employees";
import type { EmployeeRecordView } from "@/lib/api/records";
import { fetchEmployeeRecord } from "@/lib/api/records";
import {
  employeePhotoUrl,
  fetchApprovalRequestDetail,
  fetchEmployeeChangeHistory,
} from "@/lib/api/employees";
import { formatApiErrorMessage } from "@/lib/api/client";
import { toDateInputValue } from "@/lib/format/date-input";

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

function actionLabel(action: string) {
  if (action === "CREATE") return "Penambahan data";
  if (action === "UPDATE") return "Perubahan data";
  if (action === "DELETE") return "Penghapusan";
  return action;
}

function statusLabel(status: string) {
  if (status === "PENDING_APPROVAL") return "Menunggu persetujuan";
  if (status === "APPROVED") return "Disetujui";
  if (status === "REJECTED") return "Ditolak — perlu revisi";
  return status;
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="portal-modal-backdrop"
      role="presentation"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        className={`portal-modal${wide ? " portal-modal-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="portal-modal-header">
          <h2 id="portal-modal-title">{title}</h2>
          <button type="button" className="portal-modal-close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="portal-modal-body">{children}</div>
      </div>
    </div>
  );
}

function DetailPhoto({
  companyId,
  recordId,
  token,
}: {
  companyId: string;
  recordId: string;
  token: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const res = await fetch(employeePhotoUrl(companyId, recordId), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok || cancelled) return;
      const blob = await res.blob();
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [companyId, recordId, token]);
  if (!src) return <p className="explore-muted">Foto tidak tersedia</p>;
  return (
    <img src={src} alt="" className="employee-detail-photo" width={160} height={160} />
  );
}

function DetailGrid({
  data,
}: {
  data: {
    employeeName?: string | null;
    nationalIdNumber?: string | null;
    placeOfBirth?: string | null;
    dateOfBirth?: string | null;
    position?: string | null;
    joinedAt?: string | null;
    leftAt?: string | null;
    employeeIdNumber?: string | null;
    conductSummary?: string | null;
    rejectionReason?: string | null;
  };
}) {
  const rows = [
    ["Nama lengkap", data.employeeName],
    ["NIK", data.nationalIdNumber],
    ["Tempat lahir", data.placeOfBirth],
    ["Tanggal lahir", fmtDate(data.dateOfBirth)],
    ["Posisi / jabatan", data.position],
    ["Mulai bekerja", fmtDate(data.joinedAt)],
    ["Selesai", fmtDate(data.leftAt)],
    ["ID karyawan internal", data.employeeIdNumber],
    ["Ringkasan perilaku", data.conductSummary],
  ];
  return (
    <dl className="portal-detail-grid">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value?.toString().trim() ? value : "—"}</dd>
        </div>
      ))}
      {data.rejectionReason && (
        <div className="portal-detail-reject">
          <dt>Alasan penolakan pimpinan</dt>
          <dd>{data.rejectionReason}</dd>
        </div>
      )}
    </dl>
  );
}

export function EmployeeDetailModal({
  companyId,
  token,
  recordId,
  requestId,
  rejectionReason,
  onClose,
}: {
  companyId: string;
  token: string;
  recordId?: string | null;
  requestId?: string | null;
  rejectionReason?: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<EmployeeRecordView | null>(null);
  const [request, setRequest] = useState<EmployeeChangeRequest | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (recordId && !recordId.startsWith("pending-")) {
          const r = await fetchEmployeeRecord(companyId, recordId, { token });
          if (!cancelled) setRecord(r);
        } else if (requestId) {
          const r = await fetchApprovalRequestDetail(companyId, token, requestId);
          if (!cancelled) setRequest(r);
        }
      } catch (err) {
        if (!cancelled) setError(formatApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, token, recordId, requestId]);

  const payload = request?.payload;
  const detail = record
    ? {
        employeeName: record.employeeName,
        nationalIdNumber: record.nationalIdNumber,
        placeOfBirth: record.placeOfBirth,
        dateOfBirth: record.dateOfBirth,
        position: record.position,
        joinedAt: record.joinedAt,
        leftAt: record.leftAt,
        employeeIdNumber: record.employeeIdNumber,
        conductSummary: record.conductSummary,
        rejectionReason: rejectionReason ?? request?.rejectionReason,
      }
    : payload
      ? {
          employeeName: payload.employeeName,
          nationalIdNumber: payload.nationalIdNumber,
          placeOfBirth: payload.placeOfBirth,
          dateOfBirth: payload.dateOfBirth,
          position: payload.position,
          joinedAt: payload.joinedAt,
          leftAt: payload.leftAt,
          employeeIdNumber: payload.employeeIdNumber ?? payload.employeeCode,
          conductSummary: payload.conductSummary,
          rejectionReason: rejectionReason ?? request?.rejectionReason,
        }
      : null;

  const photoRecordId =
    record?.id ?? (request?.employeeRecordId && !request.employeeRecordId.startsWith("pending")
      ? request.employeeRecordId
      : null);

  return (
    <ModalShell title="Detail karyawan" onClose={onClose} wide>
      {loading && <Loader2 className="animate-spin" />}
      {error && <p className="explore-error">{error}</p>}
      {!loading && detail && (
        <div className="portal-detail-layout">
          {photoRecordId && token ? (
            <DetailPhoto companyId={companyId} recordId={photoRecordId} token={token} />
          ) : request?.payload?.photoStagingPath ? (
            <p className="explore-muted">Foto menunggu persetujuan / staging</p>
          ) : null}
          <DetailGrid data={detail} />
        </div>
      )}
      {request && (
        <p className="portal-detail-meta explore-muted">
          Pengajuan: {actionLabel(request.action)} — {statusLabel(request.status)}
          {request.requestedBy
            ? ` · oleh ${request.requestedBy.fullName}`
            : ""}
        </p>
      )}
    </ModalShell>
  );
}

export function EmployeeEditModal({
  companyId,
  token,
  recordId,
  initial,
  requiresApproval,
  onClose,
  onSaved,
}: {
  companyId: string;
  token: string;
  recordId: string;
  initial: UpdateEmployeeInput & { employeeName: string };
  /** Admin: antrean persetujuan. Pimpinan: langsung aktif. */
  requiresApproval: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(() => ({
    ...initial,
    dateOfBirth: toDateInputValue(initial.dateOfBirth),
    joinedAt: toDateInputValue(initial.joinedAt),
    leftAt: toDateInputValue(initial.leftAt),
  }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      ...initial,
      dateOfBirth: toDateInputValue(initial.dateOfBirth),
      joinedAt: toDateInputValue(initial.joinedAt),
      leftAt: toDateInputValue(initial.leftAt),
    });
  }, [initial, recordId]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { updateEmployeeRecord } = await import("@/lib/api/employees");
      await updateEmployeeRecord(companyId, token, recordId, {
        ...form,
        photo: photo ?? undefined,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalShell title="Edit data karyawan" onClose={onClose} wide>
      <p className="register-hint">
        {requiresApproval
          ? "Perubahan oleh Admin masuk antrean persetujuan. Pimpinan menyetujui jika sudah benar — data langsung diperbarui."
          : "Sebagai Pimpinan, perubahan langsung diterapkan tanpa persetujuan tambahan."}
      </p>
      <form className="register-grid register-grid-employee" onSubmit={onSubmit}>
        <label>
          <span>NIK (16 digit)</span>
          <input
            value={form.nationalIdNumber ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                nationalIdNumber: e.target.value.replace(/\D/g, "").slice(0, 16),
              }))
            }
            inputMode="numeric"
            maxLength={16}
          />
        </label>
        <label>
          <span>Nama lengkap</span>
          <input
            value={form.employeeName}
            onChange={(e) => setForm((f) => ({ ...f, employeeName: e.target.value }))}
            required
          />
        </label>
        <label>
          <span>Tempat lahir</span>
          <input
            value={form.placeOfBirth ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, placeOfBirth: e.target.value }))}
          />
        </label>
        <label>
          <span>Tanggal lahir</span>
          <input
            type="date"
            value={form.dateOfBirth ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          />
        </label>
        <label>
          <span>Mulai bekerja</span>
          <input
            type="date"
            value={form.joinedAt ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, joinedAt: e.target.value }))}
          />
        </label>
        <label>
          <span>Selesai</span>
          <input
            type="date"
            value={form.leftAt ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, leftAt: e.target.value }))}
          />
        </label>
        <label>
          <span>Posisi</span>
          <input
            value={form.position ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
          />
        </label>
        <label>
          <span>Foto baru (opsional)</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </label>
        {error && <p className="explore-error register-full">{error}</p>}
        <div className="register-full doc-actions">
          <button type="submit" className="button button-blue" disabled={busy}>
            {requiresApproval ? "Kirim untuk persetujuan" : "Simpan perubahan"}
          </button>
          <button type="button" onClick={onClose}>Batal</button>
        </div>
      </form>
    </ModalShell>
  );
}

export function EmployeeHistoryModal({
  companyId,
  token,
  recordId,
  requestFallback,
  onClose,
}: {
  companyId: string;
  token: string;
  recordId?: string | null;
  requestFallback?: EmployeeChangeRequest | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<{
    changeCount: number;
    items: EmployeeChangeRequest[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (recordId && !recordId.startsWith("pending-")) {
          const h = await fetchEmployeeChangeHistory(companyId, token, recordId);
          if (!cancelled) setHistory(h);
        } else if (requestFallback) {
          if (!cancelled) {
            setHistory({ changeCount: 0, items: [requestFallback] });
          }
        }
      } catch (err) {
        if (!cancelled) setError(formatApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, token, recordId, requestFallback]);

  return (
    <ModalShell title="Riwayat perubahan" onClose={onClose} wide>
      {loading && <Loader2 className="animate-spin" />}
      {error && <p className="explore-error">{error}</p>}
      {history && (
        <>
          <p className="portal-detail-meta">
            Total perubahan disetujui: <strong>{history.changeCount}</strong>
          </p>
          <ul className="portal-history-list">
            {history.items.length === 0 ? (
              <li className="explore-muted">Belum ada riwayat.</li>
            ) : (
              history.items.map((item) => (
                <li key={item.id}>
                  <div className="portal-history-top">
                    <strong>{actionLabel(item.action)}</strong>
                    <span>{statusLabel(item.status)}</span>
                  </div>
                  <p className="explore-muted">
                    {fmtDate(item.createdAt)}
                    {item.requestedBy ? ` · ${item.requestedBy.fullName}` : ""}
                  </p>
                  {item.rejectionReason && (
                    <p className="portal-detail-reject-text">{item.rejectionReason}</p>
                  )}
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </ModalShell>
  );
}
