"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import Swal from "sweetalert2";
import { PortalShell } from "@/components/company/portal-shell";
import { readSession } from "@/lib/auth/session";
import { fetchPortalEmployeeList } from "@/lib/api/company-portal";
import {
  approveEmployeeRequest,
  createEmployeeRecord,
  employeePhotoUrl,
  fetchPendingEmployeeApprovals,
  fetchRejectedEmployeeApprovals,
  isPendingEmployeeCreate,
  rejectEmployeeRequest,
  type EmployeeChangeRequest,
} from "@/lib/api/employees";
import { fetchEmployeeRecord } from "@/lib/api/records";
import {
  approveBlacklistCheckout,
  blacklistCheckout,
  cancelBlacklist,
  completeBlacklistPayment,
  rejectBlacklistRequest,
} from "@/lib/api/blacklists";
import { formatApiErrorMessage } from "@/lib/api/client";
import { fetchPricingCatalog } from "@/lib/api/pricing";
import {
  listAvailableVouchers,
  type CompanyVoucherOption,
} from "@/lib/api/vouchers";
import { toDateInputValue } from "@/lib/format/date-input";
import {
  EmployeeDetailModal,
  EmployeeEditModal,
  EmployeeHistoryModal,
} from "@/components/company/employee-portal-modals";

const PAGE_SIZE = 10;

type ApprovalState = "none" | "pending" | "rejected";

type Row = {
  id: string;
  employeeName: string;
  nationalIdNumber: string | null;
  employeeIdNumber: string | null;
  position: string | null;
  hasPhoto: boolean;
  hasBlacklist: boolean;
  blacklistId: string | null;
  blacklistNote: string | null;
  joinedAt: string | null;
  leftAt: string | null;
  isPending?: boolean;
  requestId?: string;
  approvalState?: ApprovalState;
  pendingAction?: "CREATE" | "UPDATE" | "BLACKLIST";
  changeRevisionCount?: number;
  rejectionReason?: string | null;
  requestSnapshot?: EmployeeChangeRequest | null;
};

type BlacklistFilter = "all" | "yes" | "no";
type EmploymentFilter = "all" | "active" | "ended";

function EmployeeThumb({
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
  if (!src) return <span className="explore-muted">…</span>;
  return (
    <img
      src={src}
      alt=""
      className="employee-thumb"
      width={40}
      height={40}
    />
  );
}

export default function ListKaryawanPage() {
  const session = readSession();
  const token = session?.accessToken ?? "";
  const companyId = session?.user.companyId ?? "";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [blacklistFilter, setBlacklistFilter] = useState<BlacklistFilter>("all");
  const [employmentFilter, setEmploymentFilter] =
    useState<EmploymentFilter>("all");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    nationalIdNumber: "",
    employeeName: "",
    placeOfBirth: "",
    dateOfBirth: "",
    joinedAt: "",
    leftAt: "",
    position: "",
  });

  const [blRecordId, setBlRecordId] = useState<string | null>(null);
  const [blRequestId, setBlRequestId] = useState<string | null>(null);
  const [blMode, setBlMode] = useState<
    "admin_submit" | "leadership_pay" | "leadership_approve"
  >("leadership_pay");
  const [blNoteReadOnly, setBlNoteReadOnly] = useState(false);
  const [blEmployeeName, setBlEmployeeName] = useState("");
  const [blNote, setBlNote] = useState("");
  const [blVoucher, setBlVoucher] = useState("");
  const [blFeeIdr, setBlFeeIdr] = useState<number | null>(null);
  const [blVoucherOptions, setBlVoucherOptions] = useState<
    CompanyVoucherOption[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const isLeadership =
    session?.user.accountType === "LEADERSHIP" ||
    session?.user.roleCode === "OWNER";
  const isAdmin = session?.user.accountType === "ADMIN";

  useEffect(() => {
    if (!blRecordId || !token || blMode === "admin_submit") {
      setBlVoucherOptions([]);
      setBlFeeIdr(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [catalog, vouchers] = await Promise.all([
          fetchPricingCatalog(),
          listAvailableVouchers(token, "BLACKLIST"),
        ]);
        if (cancelled) return;
        setBlFeeIdr(
          catalog.fees.sanggahanKaryawanIdr ??
            catalog.fees.blacklistIdr ??
            null,
        );
        setBlVoucherOptions(vouchers);
      } catch {
        if (!cancelled) {
          setBlFeeIdr(null);
          setBlVoucherOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blRecordId, token, blMode]);

  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [historyRow, setHistoryRow] = useState<Row | null>(null);
  const [editCtx, setEditCtx] = useState<{
    recordId: string;
    requiresApproval: boolean;
    initial: {
      employeeName: string;
      nationalIdNumber?: string;
      placeOfBirth?: string;
      dateOfBirth?: string;
      joinedAt?: string;
      leftAt?: string;
      position?: string;
      employeeIdNumber?: string;
    };
  } | null>(null);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (r.isPending && blacklistFilter === "yes") return false;
      if (blacklistFilter === "yes" && !r.hasBlacklist) return false;
      if (blacklistFilter === "no" && r.hasBlacklist) return false;
      if (employmentFilter === "active" && r.leftAt) return false;
      if (employmentFilter === "ended" && !r.leftAt) return false;
      if (!q) return true;
      const hay = [
        r.employeeName,
        r.nationalIdNumber ?? "",
        r.employeeIdNumber ?? "",
        r.position ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery, blacklistFilter, employmentFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, blacklistFilter, employmentFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pickPhotoFile = (file: File | null | undefined) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Foto harus JPG, PNG, atau WEBP.");
      return;
    }
    setPhotoFile(file);
    setError(null);
  };

  const mapRequestRow = (
    p: EmployeeChangeRequest,
    approvalState: ApprovalState,
  ): Row => {
    const pl = p.payload ?? {};
    const isCreate = p.action === "CREATE";
    const isBlacklist = p.action === "BLACKLIST";
    return {
      id: isCreate ? `pending-${p.id}` : (p.employeeRecordId ?? `pending-${p.id}`),
      requestId: p.id,
      isPending: approvalState === "pending",
      approvalState,
      pendingAction: isBlacklist
        ? "BLACKLIST"
        : isCreate
          ? "CREATE"
          : "UPDATE",
      requestSnapshot: p,
      employeeName: pl.employeeName ?? "—",
      nationalIdNumber: pl.nationalIdNumber ?? null,
      employeeIdNumber: pl.employeeIdNumber ?? pl.employeeCode ?? null,
      position: pl.position ?? null,
      hasPhoto: Boolean(pl.photoStagingPath),
      hasBlacklist: false,
      blacklistId: null,
      blacklistNote: null,
      joinedAt: pl.joinedAt ?? null,
      leftAt: pl.leftAt ?? null,
      rejectionReason: p.rejectionReason ?? null,
      changeRevisionCount: 0,
    };
  };

  const reload = async () => {
    if (!token || !companyId) return;
    try {
      const [data, pending, rejected] = await Promise.all([
        fetchPortalEmployeeList(companyId, token),
        fetchPendingEmployeeApprovals(companyId, token).catch(() => []),
        isAdmin
          ? fetchRejectedEmployeeApprovals(companyId, token).catch(() => [])
          : Promise.resolve([] as EmployeeChangeRequest[]),
      ]);

      const pendingCreate = pending.filter((p) => p.action === "CREATE");
      const pendingUpdate = pending.filter(
        (p) => p.action === "UPDATE" && p.employeeRecordId,
      );
      const pendingBlacklist = pending.filter(
        (p) => p.action === "BLACKLIST" && p.employeeRecordId,
      );
      const rejectedCreate = rejected.filter((p) => p.action === "CREATE");
      const rejectedUpdate = rejected.filter(
        (p) => p.action === "UPDATE" && p.employeeRecordId,
      );

      const pendingUpdateByRecord = new Map(
        pendingUpdate.map((p) => [p.employeeRecordId!, p]),
      );
      const pendingBlacklistByRecord = new Map(
        pendingBlacklist.map((p) => [p.employeeRecordId!, p]),
      );
      const rejectedUpdateByRecord = new Map(
        rejectedUpdate.map((p) => [p.employeeRecordId!, p]),
      );

      const activeRows: Row[] = (data as Row[]).map((r) => {
        const pbl = pendingBlacklistByRecord.get(r.id);
        const pu = pendingUpdateByRecord.get(r.id);
        const ru = rejectedUpdateByRecord.get(r.id);
        if (pbl) {
          return {
            ...r,
            requestId: pbl.id,
            approvalState: "pending",
            pendingAction: "BLACKLIST",
            isPending: true,
            requestSnapshot: pbl,
            changeRevisionCount: r.changeRevisionCount ?? 0,
          };
        }
        if (pu) {
          return {
            ...r,
            requestId: pu.id,
            approvalState: "pending",
            pendingAction: "UPDATE",
            isPending: true,
            requestSnapshot: pu,
            changeRevisionCount: r.changeRevisionCount ?? 0,
          };
        }
        if (ru) {
          return {
            ...r,
            requestId: ru.id,
            approvalState: "rejected",
            pendingAction: "UPDATE",
            rejectionReason: ru.rejectionReason,
            requestSnapshot: ru,
            changeRevisionCount: r.changeRevisionCount ?? 0,
          };
        }
        return {
          ...r,
          approvalState: "none",
          changeRevisionCount: r.changeRevisionCount ?? 0,
        };
      });

      const queueRows: Row[] = [
        ...pendingCreate.map((p) => mapRequestRow(p, "pending")),
        ...rejectedCreate.map((p) => mapRequestRow(p, "rejected")),
      ];

      setRows([...queueRows, ...activeRows]);
      setError(null);
    } catch (err) {
      setRows([]);
      setError(formatApiErrorMessage(err) || "Gagal memuat data karyawan.");
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("Silakan login untuk melihat daftar karyawan.");
      return;
    }
    if (!companyId) {
      setLoading(false);
      setError("Akun tidak terhubung ke perusahaan. Login ulang atau hubungi admin.");
      return;
    }
    void reload().finally(() => setLoading(false));
  }, [token, companyId]);

  const clearPhotoSelection = () => {
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyId || !photoFile) {
      setError("Foto karyawan wajib diunggah.");
      return;
    }
    if (!form.position.trim()) {
      setError("Posisi/jabatan wajib diisi.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await createEmployeeRecord(companyId, token, {
        nationalIdNumber: form.nationalIdNumber.trim(),
        employeeName: form.employeeName.trim(),
        placeOfBirth: form.placeOfBirth.trim(),
        dateOfBirth: form.dateOfBirth,
        joinedAt: form.joinedAt,
        leftAt: form.leftAt.trim() || undefined,
        position: form.position.trim(),
        photo: photoFile,
      });
      clearPhotoSelection();
      setPhotoInputKey((k) => k + 1);
      setForm({
        nationalIdNumber: "",
        employeeName: "",
        placeOfBirth: "",
        dateOfBirth: "",
        joinedAt: "",
        leftAt: "",
        position: "",
      });
      await reload();
      if (isPendingEmployeeCreate(result)) {
        await Swal.fire({
          icon: "info",
          title: "Menunggu persetujuan",
          text:
            "Pengajuan tersimpan. Data muncul di daftar dengan status menunggu — akun Pimpinan (Kepemimpinan) perlu menyetujui sebelum aktif di sistem.",
          confirmButtonText: "OK",
          confirmButtonColor: "#2459df",
        });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Tersimpan",
          text: "Data karyawan berhasil ditambahkan.",
          confirmButtonText: "OK",
          confirmButtonColor: "#2459df",
        });
      }
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  };

  const closeBlacklistModal = () => {
    setBlRecordId(null);
    setBlRequestId(null);
    setBlMode("leadership_pay");
    setBlNoteReadOnly(false);
    setBlEmployeeName("");
    setBlNote("");
    setBlVoucher("");
  };

  const openBlacklistModal = (row: Row) => {
    setBlRecordId(row.id);
    setBlRequestId(null);
    setBlEmployeeName(row.employeeName);
    setBlNote("");
    setBlVoucher("");
    setBlNoteReadOnly(false);
    setBlMode(isAdmin && !isLeadership ? "admin_submit" : "leadership_pay");
    setError(null);
  };

  const openApproveBlacklistModal = (row: Row) => {
    setBlRecordId(row.id);
    setBlRequestId(row.requestId ?? null);
    setBlEmployeeName(row.employeeName);
    setBlNote(row.requestSnapshot?.payload?.note ?? "");
    setBlVoucher("");
    setBlNoteReadOnly(true);
    setBlMode("leadership_approve");
    setError(null);
  };

  const onBlacklist = async () => {
    if (!token) return;
    const email = session?.user.email?.trim();
    if (!email) {
      setError(
        "Email akun tidak ada di sesi. Keluar lalu login ulang, atau hubungi admin.",
      );
      return;
    }
    if (!blNote.trim() || blNote.trim().length < 10) return;
    setBusy(true);
    setError(null);
    try {
      if (blMode === "leadership_approve" && blRequestId) {
        const checkout = await approveBlacklistCheckout(token, blRequestId, {
          email,
          voucherCode: blVoucher.trim() || undefined,
        });
        if (checkout.mode === "CHECKOUT") {
          await completeBlacklistPayment(checkout, token);
        }
        closeBlacklistModal();
        await reload();
        await Swal.fire({
          icon: "success",
          title: "Disanggahkan",
          text: "Pengajuan disetujui dan pembayaran selesai.",
          confirmButtonColor: "#2459df",
        });
        return;
      }

      if (!blRecordId) return;
      const result = await blacklistCheckout(token, {
        employeeRecordId: blRecordId,
        note: blNote.trim(),
        email,
        voucherCode: blVoucher.trim() || undefined,
      });

      if (result.mode === "PENDING_APPROVAL") {
        closeBlacklistModal();
        await reload();
        await Swal.fire({
          icon: "info",
          title: "Menunggu pimpinan",
          text:
            "Pengajuan sanggahan dikirim. Pimpinan perlu menyetujui dan membayar melalui payment gateway.",
          confirmButtonColor: "#2459df",
        });
        return;
      }

      await completeBlacklistPayment(result, token);
      closeBlacklistModal();
      await reload();
      await Swal.fire({
        icon: "success",
        title: "Disanggahkan",
        text: "Pembayaran selesai. Karyawan ditandai disanggahkan untuk perusahaan Anda.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Sanggahan gagal");
    } finally {
      setBusy(false);
    }
  };

  const onRejectBlacklist = async (requestId: string) => {
    if (!token) return;
    const result = await Swal.fire({
      title: "Tolak pengajuan sanggahan",
      input: "textarea",
      inputLabel: "Alasan penolakan (min. 5 karakter)",
      showCancelButton: true,
      confirmButtonText: "Tolak",
      confirmButtonColor: "#b91c1c",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return "Alasan wajib diisi (min. 5 karakter)";
        }
        return undefined;
      },
    });
    if (!result.isConfirmed || !result.value) return;
    setBusy(true);
    try {
      await rejectBlacklistRequest(token, requestId, result.value.trim());
      await reload();
      await Swal.fire({
        icon: "info",
        title: "Ditolak",
        text: "Admin dapat mengajukan ulang jika perlu.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menolak");
    } finally {
      setBusy(false);
    }
  };

  const onRejectPending = async (requestId: string) => {
    if (!token || !companyId) return;
    const result = await Swal.fire({
      title: "Tolak pengajuan",
      input: "textarea",
      inputLabel: "Alasan penolakan (min. 5 karakter)",
      inputPlaceholder: "Jelaskan apa yang perlu diperbaiki Admin…",
      inputAttributes: { minlength: "5" },
      showCancelButton: true,
      confirmButtonText: "Tolak",
      confirmButtonColor: "#b91c1c",
      cancelButtonText: "Batal",
      inputValidator: (value) => {
        if (!value || value.trim().length < 5) {
          return "Alasan wajib diisi (min. 5 karakter)";
        }
        return undefined;
      },
    });
    if (!result.isConfirmed || !result.value) return;
    setBusy(true);
    setError(null);
    try {
      await rejectEmployeeRequest(
        companyId,
        token,
        requestId,
        result.value.trim(),
      );
      await reload();
      await Swal.fire({
        icon: "info",
        title: "Ditolak",
        text: "Admin perlu merevisi data sesuai catatan Anda.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menolak");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = async (row: Row) => {
    if (!token || !companyId || row.id.startsWith("pending-")) return;
    setBusy(true);
    try {
      const rec = await fetchEmployeeRecord(companyId, row.id, { token });
      setEditCtx({
        recordId: row.id,
        requiresApproval: isAdmin && !isLeadership,
        initial: {
          employeeName: rec.employeeName,
          nationalIdNumber: rec.nationalIdNumber ?? "",
          placeOfBirth: rec.placeOfBirth ?? "",
          dateOfBirth: toDateInputValue(rec.dateOfBirth),
          joinedAt: toDateInputValue(rec.joinedAt),
          leftAt: toDateInputValue(rec.leftAt),
          position: rec.position ?? "",
          employeeIdNumber: rec.employeeIdNumber ?? "",
        },
      });
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const prefillFromRejected = (row: Row) => {
    const pl = row.requestSnapshot?.payload;
    if (!pl) return;
    setForm({
      nationalIdNumber: pl.nationalIdNumber ?? "",
      employeeName: pl.employeeName ?? "",
      placeOfBirth: pl.placeOfBirth ?? "",
      dateOfBirth: pl.dateOfBirth ?? "",
      joinedAt: pl.joinedAt ?? "",
      leftAt: pl.leftAt ?? "",
      position: pl.position ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onApprovePending = async (requestId: string) => {
    if (!token || !companyId) return;
    setBusy(true);
    setError(null);
    try {
      await approveEmployeeRequest(companyId, token, requestId);
      await reload();
      await Swal.fire({
        icon: "success",
        title: "Disetujui",
        text: "Karyawan sekarang aktif di daftar.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menyetujui");
    } finally {
      setBusy(false);
    }
  };

  const onCancelBl = async (blacklistId: string) => {
    if (!token) return;
    setBusy(true);
    try {
      await cancelBlacklist(token, blacklistId);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell>
      <h1>List karyawan</h1>
      <p>
        Masukkan data karyawan perusahaan Anda. Jika login sebagai <strong>Admin</strong>,
        data masuk daftar dengan status menunggu sampai akun <strong>Pimpinan</strong> menyetujui.
        Sanggahan berbayar dengan catatan pribadi (hanya PT Anda yang melihat alasan).
      </p>

      <section className="register-section">
        <h2>Tambah karyawan</h2>
        <form className="register-grid register-grid-employee" onSubmit={onAdd}>
          <label>
            <span>NIK (16 digit)</span>
            <input
              value={form.nationalIdNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                setForm((f) => ({ ...f, nationalIdNumber: digits }));
              }}
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9]{16}"
              title="NIK harus 16 digit angka"
              placeholder="16 digit angka"
              required
              minLength={16}
              maxLength={16}
            />
          </label>
          <label>
            <span>Nama lengkap</span>
            <input
              value={form.employeeName}
              onChange={(e) =>
                setForm((f) => ({ ...f, employeeName: e.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Tempat lahir</span>
            <input
              value={form.placeOfBirth}
              onChange={(e) =>
                setForm((f) => ({ ...f, placeOfBirth: e.target.value }))
              }
              placeholder="Contoh: Jakarta"
              required
              minLength={2}
            />
          </label>
          <label>
            <span>Tanggal lahir</span>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Mulai bekerja</span>
            <input
              type="date"
              value={form.joinedAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, joinedAt: e.target.value }))
              }
              required
            />
          </label>
          <label>
            <span>Selesai (kosongkan jika masih aktif)</span>
            <input
              type="date"
              value={form.leftAt}
              onChange={(e) =>
                setForm((f) => ({ ...f, leftAt: e.target.value }))
              }
            />
          </label>
          <label>
            <span>Posisi / jabatan sebagai</span>
            <input
              value={form.position}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.value }))
              }
              placeholder="Contoh: Admin Gudang, Operator Produksi"
              required
              minLength={2}
            />
          </label>
          <div className="employee-photo-field">
            <span className="employee-photo-label">Foto karyawan</span>
            <input
              key={photoInputKey}
              ref={photoInputRef}
              className="employee-photo-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required={!photoFile}
              tabIndex={-1}
              onChange={(e) => pickPhotoFile(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              className={`employee-photo-dropzone${photoDragOver ? " is-dragover" : ""}${photoPreviewUrl ? " has-preview" : ""}`}
              onClick={() => photoInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  photoInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setPhotoDragOver(true);
              }}
              onDragLeave={() => setPhotoDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setPhotoDragOver(false);
                pickPhotoFile(e.dataTransfer.files?.[0]);
              }}
            >
              {photoPreviewUrl ? (
                <>
                  <img
                    src={photoPreviewUrl}
                    alt="Pratinjau foto karyawan"
                    className="employee-photo-dropzone-preview"
                  />
                  <p className="employee-photo-dropzone-hint">
                    Klik atau seret file lain untuk mengganti
                  </p>
                </>
              ) : (
                <>
                  <ImagePlus
                    className="employee-photo-dropzone-icon"
                    size={28}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                  <p className="employee-photo-dropzone-title">
                    Unggah foto karyawan
                  </p>
                  <p className="employee-photo-dropzone-hint">
                    Klik atau seret JPG, PNG, atau WEBP (wajib)
                  </p>
                </>
              )}
            </div>
          </div>
          <button
            type="submit"
            className="button button-blue register-full"
            disabled={busy}
          >
            Simpan karyawan
          </button>
        </form>
      </section>

      {error && <p className="explore-error">{error}</p>}

      <div className="portal-list-filters">
        <label>
          <span>Cari nama / NIK / posisi</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik untuk memfilter…"
          />
        </label>
        <label>
          <span>Disanggahkan</span>
          <select
            value={blacklistFilter}
            onChange={(e) =>
              setBlacklistFilter(e.target.value as BlacklistFilter)
            }
          >
            <option value="all">Semua</option>
            <option value="no">Belum disanggahkan</option>
            <option value="yes">Sedang disanggahkan</option>
          </select>
        </label>
        <label>
          <span>Status kerja</span>
          <select
            value={employmentFilter}
            onChange={(e) =>
              setEmploymentFilter(e.target.value as EmploymentFilter)
            }
          >
            <option value="all">Semua</option>
            <option value="active">Masih aktif</option>
            <option value="ended">Sudah selesai</option>
          </select>
        </label>
      </div>

      <p className="portal-list-filter-meta">
        Total <strong>{filteredRows.length}</strong> baris
        {filteredRows.length > 0 && (
          <>
            {" "}
            — halaman <strong>{safePage}</strong> / <strong>{totalPages}</strong>
          </>
        )}
      </p>

      {loading ? (
        <Loader2 className="animate-spin" />
      ) : (
        <table className="portal-table">
          <thead>
            <tr>
              <th>Foto</th>
              <th>Nama</th>
              <th>NIK</th>
              <th>Posisi</th>
              <th>Status</th>
              <th>Disanggahkan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="explore-muted">
                  {rows.length === 0
                    ? "Belum ada data karyawan."
                    : "Tidak ada baris yang cocok dengan filter."}
                </td>
              </tr>
            ) : (
              pageRows.map((r) => (
                <tr
                  key={r.id}
                  className={r.isPending ? "portal-row-pending" : undefined}
                >
                  <td>
                    {r.hasPhoto && token && !r.isPending ? (
                      <EmployeeThumb
                        companyId={companyId}
                        recordId={r.id}
                        token={token}
                      />
                    ) : r.isPending && r.hasPhoto ? (
                      <span className="explore-muted" title="Foto menunggu persetujuan">
                        Ada
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{r.employeeName}</td>
                  <td>{r.nationalIdNumber ?? "—"}</td>
                  <td>{r.position ?? "—"}</td>
                  <td>
                    {r.approvalState === "pending" ? (
                      <span className="portal-badge-pending">
                        {r.pendingAction === "BLACKLIST"
                          ? "Menunggu persetujuan sanggahan"
                          : r.pendingAction === "UPDATE"
                            ? "Menunggu persetujuan (ubah data)"
                            : "Menunggu persetujuan"}
                      </span>
                    ) : r.approvalState === "rejected" ? (
                      <span className="portal-badge-rejected">Perlu revisi</span>
                    ) : (
                      <span className="explore-muted">Aktif</span>
                    )}
                  </td>
                  <td>
                    {r.hasBlacklist ? (
                      <span title={r.blacklistNote ?? ""}>
                        Aktif — catatan internal
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <div className="portal-row-actions">
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => setDetailRow(r)}
                      >
                        Detail
                      </button>
                      {(r.changeRevisionCount ?? 0) > 0 ||
                      r.requestSnapshot ||
                      (!r.id.startsWith("pending-") &&
                        r.approvalState !== "pending") ? (
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={() => setHistoryRow(r)}
                        >
                          Riwayat
                          {(r.changeRevisionCount ?? 0) > 0
                            ? ` (${r.changeRevisionCount})`
                            : ""}
                        </button>
                      ) : null}
                      {isAdmin &&
                        r.approvalState === "rejected" &&
                        r.pendingAction === "CREATE" && (
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => prefillFromRejected(r)}
                          >
                            Perbaiki
                          </button>
                        )}
                      {(isAdmin || isLeadership) &&
                        !r.id.startsWith("pending-") &&
                        r.approvalState !== "pending" && (
                          <button
                            type="button"
                            className="button button-outline"
                            disabled={busy}
                            onClick={() => void openEdit(r)}
                          >
                            Edit
                          </button>
                        )}
                      {r.approvalState === "pending" &&
                        isLeadership &&
                        r.requestId &&
                        r.pendingAction === "BLACKLIST" && (
                          <>
                            <button
                              type="button"
                              className="button button-blue"
                              disabled={busy}
                              onClick={() => openApproveBlacklistModal(r)}
                            >
                              Setujui &amp; bayar
                            </button>
                            <button
                              type="button"
                              className="button button-outline"
                              disabled={busy}
                              onClick={() => void onRejectBlacklist(r.requestId!)}
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      {r.approvalState === "pending" &&
                        isLeadership &&
                        r.requestId &&
                        r.pendingAction !== "BLACKLIST" && (
                          <>
                            <button
                              type="button"
                              className="button button-blue"
                              disabled={busy}
                              onClick={() => void onApprovePending(r.requestId!)}
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              className="button button-outline"
                              disabled={busy}
                              onClick={() => void onRejectPending(r.requestId!)}
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      {r.approvalState !== "pending" &&
                        !r.id.startsWith("pending-") &&
                        !r.hasBlacklist && (
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => openBlacklistModal(r)}
                          >
                            Sanggahkan
                          </button>
                        )}
                      {r.approvalState !== "pending" &&
                        !r.id.startsWith("pending-") &&
                        r.hasBlacklist &&
                        r.blacklistId && (
                          <button
                            type="button"
                            className="button button-outline"
                            disabled={busy}
                            onClick={() => onCancelBl(r.blacklistId!)}
                          >
                            Tarik sanggahan
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {!loading && filteredRows.length > PAGE_SIZE && (
        <nav className="portal-pagination" aria-label="Halaman daftar karyawan">
          <p className="portal-pagination-meta">
            Baris {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filteredRows.length)} dari{" "}
            {filteredRows.length}
          </p>
          <div className="portal-pagination-actions">
            <button
              type="button"
              className="button button-outline"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </button>
            <span className="explore-muted">{safePage} / {totalPages}</span>
            <button
              type="button"
              className="button button-outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </button>
          </div>
        </nav>
      )}

      {detailRow && (
        <EmployeeDetailModal
          companyId={companyId}
          token={token}
          recordId={
            detailRow.id.startsWith("pending-") ? null : detailRow.id
          }
          requestId={detailRow.requestId}
          rejectionReason={detailRow.rejectionReason}
          onClose={() => setDetailRow(null)}
        />
      )}
      {editCtx && (
        <EmployeeEditModal
          companyId={companyId}
          token={token}
          recordId={editCtx.recordId}
          initial={editCtx.initial}
          requiresApproval={editCtx.requiresApproval}
          onClose={() => setEditCtx(null)}
          onSaved={async () => {
            await reload();
            if (editCtx.requiresApproval) {
              await Swal.fire({
                icon: "info",
                title: "Pengajuan perubahan",
                text:
                  "Perubahan dikirim ke Pimpinan. Setelah disetujui, data langsung diperbarui.",
                confirmButtonColor: "#2459df",
              });
            } else {
              await Swal.fire({
                icon: "success",
                title: "Tersimpan",
                text: "Data karyawan berhasil diperbarui.",
                confirmButtonColor: "#2459df",
              });
            }
          }}
        />
      )}
      {historyRow && (
        <EmployeeHistoryModal
          companyId={companyId}
          token={token}
          recordId={
            historyRow.id.startsWith("pending-") ? null : historyRow.id
          }
          requestFallback={historyRow.requestSnapshot}
          onClose={() => setHistoryRow(null)}
        />
      )}

      {blRecordId && (
        <div
          className="portal-modal-backdrop"
          role="presentation"
          onClick={closeBlacklistModal}
        >
          <div
            className="portal-modal portal-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sanggahan-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="portal-modal-header">
              <h2 id="sanggahan-modal-title">
                Sanggahan — {blEmployeeName || "karyawan"}
              </h2>
              <button
                type="button"
                className="portal-modal-close"
                onClick={closeBlacklistModal}
              >
                <X size={20} aria-hidden />
              </button>
            </header>
            <div className="portal-modal-body">
              <p className="register-hint">
                {blMode === "admin_submit"
                  ? "Admin mengajukan sanggahan. Pimpinan yang menyetujui sekaligus membayar lewat payment gateway."
                  : "Catatan alasan hanya untuk perusahaan Anda. Perusahaan lain hanya melihat tanda disanggahkan."}
              </p>
              <label className="portal-blacklist-field">
                <span>Alasan sanggahan</span>
                <textarea
                  value={blNote}
                  onChange={(e) => setBlNote(e.target.value)}
                  rows={4}
                  placeholder="Alasan sanggahan (min. 10 karakter)"
                  minLength={10}
                  required
                  readOnly={blNoteReadOnly}
                  disabled={blNoteReadOnly}
                />
              </label>
              {blMode !== "admin_submit" && (
                <>
                  {blFeeIdr != null && (
                    <p className="portal-fee-line">
                      Biaya sanggahan karyawan:{" "}
                      <strong>
                        Rp {blFeeIdr.toLocaleString("id-ID")}
                      </strong>
                    </p>
                  )}
                  <label className="portal-blacklist-field">
                    <span>Voucher (opsional)</span>
                    <select
                      value={blVoucher}
                      onChange={(e) => setBlVoucher(e.target.value)}
                    >
                      <option value="">Tanpa voucher</option>
                      {blVoucherOptions.map((v) => (
                        <option key={v.code} value={v.code}>
                          {v.code} — {v.title}
                          {v.benefitType === "FREE"
                            ? " (gratis)"
                            : v.benefitType === "PERCENT"
                              ? ` (${v.benefitValue}% off)`
                              : v.benefitType === "FIXED"
                                ? ` (Rp ${v.benefitValue.toLocaleString("id-ID")} off)`
                                : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {error && <p className="explore-error">{error}</p>}
              <div className="doc-actions">
                <button
                  type="button"
                  className="button button-blue"
                  disabled={busy || blNote.trim().length < 10}
                  onClick={() => void onBlacklist()}
                >
                  {busy
                    ? "Memproses…"
                    : blMode === "admin_submit"
                      ? "Ajukan sanggahan"
                      : blMode === "leadership_approve"
                        ? "Setujui & bayar"
                        : "Bayar & sanggahkan"}
                </button>
                <button type="button" onClick={closeBlacklistModal}>
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalShell>
  );
}
