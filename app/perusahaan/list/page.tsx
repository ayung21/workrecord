"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Eye,
  History,
  ImagePlus,
  Loader2,
  Pencil,
  RotateCcw,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { PortalShell } from "@/components/company/portal-shell";
import { readSession } from "@/lib/auth/session";
import { fetchPortalEmployeeList } from "@/lib/api/company-portal";
import {
  approveEmployeeRequest,
  createEmployeeRecord,
  deleteEmployeeRecord,
  employeePhotoUrl,
  fetchDeletedEmployeeHistory,
  fetchPendingEmployeeApprovals,
  fetchRejectedEmployeeApprovals,
  isPendingEmployeeCreate,
  rejectEmployeeRequest,
  type DeletedEmployeeRow,
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
import { ManualBankAccountPicker } from "@/components/payments/manual-bank-picker";
import { showManualTransferAlert } from "@/lib/payments/manual-transfer-alert";
import { useManualBankSelection } from "@/lib/payments/use-manual-bank-selection";
import { formatApiErrorMessage } from "@/lib/api/client";
import {
  employeePhotoMaxRawSizeLabel,
  prepareEmployeePhotoForUpload,
} from "@/lib/company/employee-photo-upload";
import { fetchPricingCatalog } from "@/lib/api/pricing";
import {
  listAvailableVouchers,
  quoteVoucher,
  type CompanyVoucherOption,
} from "@/lib/api/vouchers";
import { toDateInputValue } from "@/lib/format/date-input";
import { DdMmYyyyDateField } from "@/components/forms/dd-mm-yyyy-date-field";
import {
  EmployeeDetailModal,
  EmployeeEditModal,
  EmployeeHistoryModal,
} from "@/components/company/employee-portal-modals";

const PAGE_SIZE = 10;

function formatPortalDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const listSwal = Swal.mixin({
  scrollbarPadding: false,
  confirmButtonColor: "#2459df",
});

function todayDateMax(): string {
  return new Date().toISOString().slice(0, 10);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function validateEmployeeDates(form: {
  dateOfBirth: string;
  joinedAt: string;
  leftAt: string;
}): string | null {
  if (!ISO_DATE.test(form.dateOfBirth)) {
    return "Tanggal lahir belum valid. Gunakan DD/MM/YYYY atau tombol kalender.";
  }
  if (!ISO_DATE.test(form.joinedAt)) {
    return "Tanggal mulai bekerja belum valid. Gunakan DD/MM/YYYY atau tombol kalender.";
  }
  if (form.leftAt && !ISO_DATE.test(form.leftAt)) {
    return "Tanggal selesai belum valid. Gunakan DD/MM/YYYY atau tombol kalender.";
  }
  const today = todayDateMax();
  if (form.dateOfBirth && form.dateOfBirth > today) {
    return "Tanggal lahir tidak boleh di masa depan.";
  }
  if (form.joinedAt && form.joinedAt > today) {
    return "Tanggal mulai bekerja tidak boleh di masa depan.";
  }
  if (form.leftAt && form.joinedAt && form.leftAt < form.joinedAt) {
    return "Tanggal selesai harus sama atau setelah tanggal mulai bekerja.";
  }
  if (form.dateOfBirth && form.joinedAt && form.dateOfBirth >= form.joinedAt) {
    return "Tanggal lahir harus sebelum tanggal mulai bekerja.";
  }
  return null;
}

type ApprovalState = "none" | "pending" | "awaiting_payment" | "rejected";

function isRowApprovalLocked(state: ApprovalState | undefined): boolean {
  return state === "pending" || state === "awaiting_payment";
}

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
  const manualBank = useManualBankSelection();

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
  const photoFieldRef = useRef<HTMLDivElement>(null);
  const addSubmitLock = useRef(false);
  const blSubmitLock = useRef(false);
  const approveSubmitLock = useRef(false);
  const [photoInvalid, setPhotoInvalid] = useState(false);
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const maxDateToday = useMemo(() => todayDateMax(), []);
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
  const [blVoucherLoadIssue, setBlVoucherLoadIssue] = useState<string | null>(
    null,
  );
  const [blVoucherQuote, setBlVoucherQuote] = useState<{
    finalAmount: number;
    discountAmount: number;
  } | null>(null);
  const [blVoucherQuoteError, setBlVoucherQuoteError] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const isLeadership =
    session?.user.accountType === "LEADERSHIP" ||
    session?.user.roleCode === "OWNER";
  const isAdmin = session?.user.accountType === "ADMIN";
  /** Ajukan ke pimpinan — tidak bayar di langkah ini (hanya pimpinan yang transfer). */
  const submitsSanggahanForApproval =
    blMode === "admin_submit" ||
    (blMode === "leadership_pay" && !isLeadership);
  const requiresManualBankOnSubmit =
    blMode === "leadership_approve" ||
    (blMode === "leadership_pay" && isLeadership);

  useEffect(() => {
    if (!blRecordId || !token) {
      setBlVoucherOptions([]);
      setBlFeeIdr(null);
      setBlVoucherLoadIssue(null);
      setBlVoucherQuote(null);
      setBlVoucherQuoteError(null);
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
        setBlVoucherLoadIssue(null);
      } catch (err) {
        if (!cancelled) {
          setBlFeeIdr(null);
          setBlVoucherOptions([]);
          setBlVoucherLoadIssue(
            err instanceof Error
              ? err.message
              : "Gagal memuat daftar voucher.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blRecordId, token]);

  useEffect(() => {
    if (!blRecordId || blFeeIdr == null) {
      setBlVoucherQuote(null);
      setBlVoucherQuoteError(null);
      return;
    }
    const code = blVoucher.trim();
    if (!code) {
      setBlVoucherQuote(null);
      setBlVoucherQuoteError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const q = await quoteVoucher({
          code,
          appliesTo: "BLACKLIST",
          amount: blFeeIdr,
          companyId: companyId || undefined,
        });
        if (cancelled) return;
        setBlVoucherQuote({
          finalAmount: q.finalAmount,
          discountAmount: q.discountAmount,
        });
        setBlVoucherQuoteError(null);
      } catch (err) {
        if (cancelled) return;
        setBlVoucherQuote(null);
        setBlVoucherQuoteError(
          formatApiErrorMessage(err) || "Voucher tidak dapat dipakai.",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blVoucher, blFeeIdr, blRecordId, companyId]);

  const showSanggahanFeeAndVoucher =
    Boolean(blRecordId) &&
    (requiresManualBankOnSubmit || blMode === "admin_submit");

  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [historyRow, setHistoryRow] = useState<Row | null>(null);
  const [showDeletedHistory, setShowDeletedHistory] = useState(false);
  const [deletedRows, setDeletedRows] = useState<DeletedEmployeeRow[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
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

  const pickPhotoFile = async (file: File | null | undefined) => {
    if (!file) return;
    setPhotoProcessing(true);
    setError(null);
    try {
      const prepared = await prepareEmployeePhotoForUpload(file);
      setPhotoFile(prepared);
      setPhotoInvalid(false);
    } catch (err) {
      setPhotoFile(null);
      setPhotoInvalid(false);
      setError(
        err instanceof Error ? err.message : "Gagal memproses foto.",
      );
    } finally {
      setPhotoProcessing(false);
    }
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
          const awaitingPay = pbl.awaitingBlacklistPayment === true;
          return {
            ...r,
            requestId: pbl.id,
            approvalState: awaitingPay ? "awaiting_payment" : "pending",
            pendingAction: "BLACKLIST",
            isPending: !awaitingPay,
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

      const activeNikSet = new Set(
        activeRows
          .map((r) => r.nationalIdNumber?.replace(/\D/g, "") ?? "")
          .filter((nik) => nik.length === 16),
      );

      const queueRows: Row[] = [
        ...pendingCreate
          .filter((p) => {
            const nik = (p.payload?.nationalIdNumber ?? "").replace(/\D/g, "");
            return !nik || !activeNikSet.has(nik);
          })
          .map((p) => mapRequestRow(p, "pending")),
        ...rejectedCreate.map((p) => mapRequestRow(p, "rejected")),
      ];

      setRows([...queueRows, ...activeRows]);
      setError(null);
    } catch (err) {
      setRows([]);
      setError(formatApiErrorMessage(err) || "Gagal memuat data karyawan.");
    }
  };

  const loadDeletedHistory = async () => {
    if (!token || !companyId) return;
    setDeletedLoading(true);
    try {
      const res = await fetchDeletedEmployeeHistory(companyId, token);
      setDeletedRows(res.items ?? []);
    } catch (err) {
      setDeletedRows([]);
      setError(formatApiErrorMessage(err) || "Gagal memuat riwayat hapus.");
    } finally {
      setDeletedLoading(false);
    }
  };

  const toggleDeletedHistory = () => {
    const next = !showDeletedHistory;
    setShowDeletedHistory(next);
    if (next) void loadDeletedHistory();
  };

  const onDeleteEmployee = async (row: Row) => {
    if (!token || !companyId || !isLeadership) return;
    const result = await listSwal.fire({
      icon: "warning",
      title: "Hapus karyawan?",
      html: `Data <strong>${row.employeeName}</strong> akan dihapus dari daftar aktif dan tercatat di riwayat hapus.`,
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;
    setBusy(true);
    setError(null);
    try {
      await deleteEmployeeRecord(companyId, token, row.id);
      await reload();
      if (showDeletedHistory) await loadDeletedHistory();
      await listSwal.fire({
        icon: "success",
        title: "Dihapus",
        text: "Karyawan dipindahkan ke riwayat hapus.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menghapus.");
    } finally {
      setBusy(false);
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
    setPhotoInvalid(false);
  };

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyId) return;
    if (addSubmitLock.current || busy || photoProcessing) return;
    const dateErr = validateEmployeeDates(form);
    if (dateErr) {
      setError(dateErr);
      return;
    }
    if (!photoFile) {
      setPhotoInvalid(true);
      setError("Foto karyawan wajib diunggah.");
      photoFieldRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    if (!form.position.trim()) {
      setError("Posisi/jabatan wajib diisi.");
      return;
    }
    addSubmitLock.current = true;
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
        await listSwal.fire({
          icon: "info",
          title: "Menunggu persetujuan",
          text:
            "Pengajuan tersimpan. Data muncul di daftar dengan status menunggu — akun Pimpinan (Kepemimpinan) perlu menyetujui sebelum aktif di sistem.",
          confirmButtonText: "OK",
          confirmButtonColor: "#2459df",
        });
      } else {
        await listSwal.fire({
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
      addSubmitLock.current = false;
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
    setBlVoucherQuote(null);
    setBlVoucherQuoteError(null);
  };

  const openBlacklistModal = (row: Row) => {
    setBlRecordId(row.id);
    setBlRequestId(null);
    setBlEmployeeName(row.employeeName);
    setBlNote("");
    setBlVoucher("");
    setBlVoucherQuote(null);
    setBlVoucherQuoteError(null);
    setBlNoteReadOnly(false);
    setBlMode(isAdmin && !isLeadership ? "admin_submit" : "leadership_pay");
    setError(null);
  };

  const openApproveBlacklistModal = (row: Row) => {
    setBlRecordId(row.id);
    setBlRequestId(row.requestId ?? null);
    setBlEmployeeName(row.employeeName);
    setBlNote(row.requestSnapshot?.payload?.note ?? "");
    const savedVoucher =
      typeof row.requestSnapshot?.payload?.voucherCode === "string"
        ? row.requestSnapshot.payload.voucherCode
        : "";
    setBlVoucher(savedVoucher);
    setBlVoucherQuote(null);
    setBlVoucherQuoteError(null);
    setBlNoteReadOnly(true);
    setBlMode("leadership_approve");
    setError(null);
  };

  const onBlacklist = async () => {
    if (blSubmitLock.current || busy) return;
    if (!token) {
      setError("Sesi login habis. Silakan keluar lalu login ulang.");
      return;
    }
    const email = session?.user.email?.trim();
    if (!email) {
      setError(
        "Email akun tidak ada di sesi. Keluar lalu login ulang, atau hubungi admin.",
      );
      return;
    }
    const note = blNote.trim();
    if (note.length < 10) {
      await listSwal.fire({
        icon: "warning",
        title: "Alasan terlalu singkat",
        text: `Isi alasan sanggahan minimal 10 karakter (saat ini ${note.length}).`,
        confirmButtonText: "Mengerti",
        confirmButtonColor: "#2459df",
      });
      return;
    }
    if (requiresManualBankOnSubmit) {
      const bankErr = manualBank.validateSelection();
      if (bankErr) {
        setError(bankErr);
        return;
      }
    }
    if (blVoucher.trim() && blVoucherQuoteError) {
      setError(blVoucherQuoteError);
      return;
    }
    if (blVoucher.trim() && !blVoucherQuote) {
      setError("Menghitung diskon voucher… tunggu sebentar lalu coba lagi.");
      return;
    }
    blSubmitLock.current = true;
    setBusy(true);
    setError(null);
    try {
      if (blMode === "leadership_approve" && blRequestId) {
        const checkout = await approveBlacklistCheckout(token, blRequestId, {
          email,
          voucherCode: blVoucher.trim() || undefined,
          manualBankAccountId: manualBank.selectedAccountId || undefined,
        });
        if (checkout.mode === "CHECKOUT") {
          const paid = await completeBlacklistPayment(checkout, token);
          closeBlacklistModal();
          await reload();
          if (paid.kind === "manual") {
            await showManualTransferAlert(
              "Menunggu konfirmasi transfer",
              paid.manualTransfer,
              "Setelah dana masuk, admin WorkRecord akan mengonfirmasi. Sanggahan aktif setelah pembayaran disetujui.",
            );
            return;
          }
          await listSwal.fire({
            icon: "success",
            title: "Disanggahkan",
            text: "Pengajuan disetujui dan pembayaran selesai.",
            confirmButtonColor: "#2459df",
          });
          return;
        }
        closeBlacklistModal();
        await reload();
        return;
      }

      if (!blRecordId) {
        setError("Data karyawan tidak ditemukan. Tutup dialog lalu coba lagi.");
        return;
      }
      const result = await blacklistCheckout(token, {
        employeeRecordId: blRecordId,
        note,
        email,
        voucherCode: blVoucher.trim() || undefined,
        manualBankAccountId: manualBank.selectedAccountId || undefined,
      });

      if (result.mode === "PENDING_APPROVAL") {
        closeBlacklistModal();
        await reload();
        await listSwal.fire({
          icon: "info",
          title: "Menunggu pimpinan",
          text:
            "Pengajuan sanggahan dikirim. Pimpinan perlu menyetujui lalu melakukan transfer sesuai instruksi pembayaran.",
          confirmButtonColor: "#2459df",
        });
        return;
      }

      const paid = await completeBlacklistPayment(result, token);
      closeBlacklistModal();
      await reload();
      if (paid.kind === "manual") {
        await showManualTransferAlert(
          "Menunggu konfirmasi transfer",
          paid.manualTransfer,
          "Setelah dana masuk, admin WorkRecord akan mengonfirmasi. Sanggahan aktif setelah pembayaran disetujui.",
        );
        return;
      }
      await listSwal.fire({
        icon: "success",
        title: "Disanggahkan",
        text: "Pembayaran selesai. Karyawan ditandai disanggahkan untuk perusahaan Anda.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Sanggahan gagal");
    } finally {
      blSubmitLock.current = false;
      setBusy(false);
    }
  };

  const onRejectBlacklist = async (requestId: string) => {
    if (!token) return;
    const result = await listSwal.fire({
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
      await listSwal.fire({
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
    const result = await listSwal.fire({
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
      await listSwal.fire({
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
    if (approveSubmitLock.current || busy) return;
    approveSubmitLock.current = true;
    setBusy(true);
    setError(null);
    try {
      await approveEmployeeRequest(companyId, token, requestId);
      await reload();
      await listSwal.fire({
        icon: "success",
        title: "Disetujui",
        text: "Karyawan sekarang aktif di daftar.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setError(formatApiErrorMessage(err) || "Gagal menyetujui");
    } finally {
      approveSubmitLock.current = false;
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
            <DdMmYyyyDateField
              value={form.dateOfBirth}
              max={maxDateToday}
              required
              onChange={(iso) =>
                setForm((f) => ({ ...f, dateOfBirth: iso }))
              }
            />
            <span className="register-field-hint">
              DD/MM/YYYY atau kalender
            </span>
          </label>
          <label className="register-grid-row2-start">
            <span>Posisi / jabatan</span>
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
          <label>
            <span>Mulai bekerja</span>
            <DdMmYyyyDateField
              value={form.joinedAt}
              max={maxDateToday}
              min={form.dateOfBirth || undefined}
              required
              onChange={(iso) =>
                setForm((f) => ({ ...f, joinedAt: iso }))
              }
            />
            <span className="register-field-hint">
              Tanggal mulai di perusahaan Anda
            </span>
          </label>
          <label>
            <span>Selesai bekerja</span>
            <DdMmYyyyDateField
              value={form.leftAt}
              max={maxDateToday}
              min={form.joinedAt || undefined}
              onChange={(iso) => setForm((f) => ({ ...f, leftAt: iso }))}
            />
            <span className="register-field-hint">
              Kosongkan jika masih aktif
            </span>
          </label>
          <div
            ref={photoFieldRef}
            className={`employee-photo-field${photoInvalid ? " is-invalid" : ""}`}
          >
            <span className="employee-photo-label">Foto karyawan (wajib)</span>
            <input
              key={photoInputKey}
              ref={photoInputRef}
              className="employee-photo-upload-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => pickPhotoFile(e.target.files?.[0])}
            />
            <div
              role="button"
              tabIndex={0}
              className={`employee-photo-dropzone${photoDragOver ? " is-dragover" : ""}${photoPreviewUrl ? " has-preview" : ""}${photoProcessing ? " is-busy" : ""}`}
              onClick={() => {
                if (!photoProcessing) photoInputRef.current?.click();
              }}
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
                if (!photoProcessing) {
                  void pickPhotoFile(e.dataTransfer.files?.[0]);
                }
              }}
            >
              {photoProcessing ? (
                <>
                  <Loader2
                    className="employee-photo-dropzone-icon animate-spin"
                    size={28}
                    aria-hidden
                  />
                  <p className="employee-photo-dropzone-title">
                    Memproses foto…
                  </p>
                  <p className="employee-photo-dropzone-hint">
                    Foto diperkecil otomatis sebelum unggah
                  </p>
                </>
              ) : photoPreviewUrl ? (
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
                    JPG, PNG, atau WEBP — maks. {employeePhotoMaxRawSizeLabel()},
                    diperkecil otomatis
                  </p>
                </>
              )}
            </div>
            {photoInvalid ? (
              <p className="employee-photo-field-error" role="alert">
                Unggah foto terlebih dahulu (JPG, PNG, atau WEBP).
              </p>
            ) : null}
          </div>
          <div className="register-form-actions">
            <button
              type="submit"
              className="button button-blue"
              disabled={busy || photoProcessing}
            >
              {busy ? "Menyimpan…" : "Simpan karyawan"}
            </button>
            <span className="register-field-hint">
              Periksa tanggal dan foto sebelum menyimpan.
            </span>
          </div>
        </form>
      </section>

      {error && <p className="explore-error">{error}</p>}

      <section className="portal-table-section" aria-labelledby="employee-list-heading">
        <div className="portal-table-section-head">
          <h2 id="employee-list-heading">Daftar karyawan</h2>
          <button
            type="button"
            className={`button button-outline${showDeletedHistory ? " is-active" : ""}`}
            onClick={toggleDeletedHistory}
          >
            <History size={16} aria-hidden />
            {showDeletedHistory ? "Sembunyikan riwayat hapus" : "Riwayat hapus"}
          </button>
        </div>
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
        <div className="portal-table-loading">
          <Loader2 className="animate-spin" size={28} aria-hidden />
          <span>Memuat daftar karyawan…</span>
        </div>
      ) : (
        <div className="portal-table-wrap">
          <table className="portal-table portal-table-employees">
            <thead>
              <tr>
                <th scope="col">Foto</th>
                <th scope="col">Nama</th>
                <th scope="col">NIK</th>
                <th scope="col">Posisi</th>
                <th scope="col">Status</th>
                <th scope="col">Disanggahkan</th>
                <th scope="col" className="portal-table-col-actions">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="portal-table-empty">
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
                    <td className="portal-table-photo">
                      {r.hasPhoto && token && !r.isPending ? (
                        <EmployeeThumb
                          companyId={companyId}
                          recordId={r.id}
                          token={token}
                        />
                      ) : r.isPending && r.hasPhoto ? (
                        <span
                          className="portal-table-photo-placeholder"
                          title="Foto menunggu persetujuan"
                        >
                          Ada
                        </span>
                      ) : (
                        <span className="portal-table-photo-placeholder">—</span>
                      )}
                    </td>
                    <td className="portal-table-name">{r.employeeName}</td>
                    <td className="portal-table-mono">
                      {r.nationalIdNumber ?? "—"}
                    </td>
                    <td>{r.position ?? "—"}</td>
                    <td>
                      {r.approvalState === "pending" ? (
                        <span className="portal-badge portal-badge-pending">
                          {r.pendingAction === "BLACKLIST"
                            ? "Menunggu sanggahan"
                            : r.pendingAction === "UPDATE"
                              ? "Menunggu ubah data"
                              : "Menunggu persetujuan"}
                        </span>
                      ) : r.approvalState === "awaiting_payment" ? (
                        <span className="portal-badge portal-badge-pending">
                          Menunggu pembayaran
                        </span>
                      ) : r.approvalState === "rejected" ? (
                        <span className="portal-badge portal-badge-rejected">
                          Perlu revisi
                        </span>
                      ) : (
                        <span className="portal-badge portal-badge-ok">Aktif</span>
                      )}
                    </td>
                    <td>
                      {r.hasBlacklist ? (
                        <span
                          className="portal-badge portal-badge-blacklist"
                          title={r.blacklistNote ?? ""}
                        >
                          Disanggahkan
                        </span>
                      ) : (
                        <span className="portal-table-muted">—</span>
                      )}
                    </td>
                    <td className="portal-table-col-actions">
                      <div className="portal-row-actions" role="group" aria-label="Tindakan baris">
                      <button
                        type="button"
                        className="portal-action-btn"
                        onClick={() => setDetailRow(r)}
                      >
                        <Eye size={14} aria-hidden />
                        Detail
                      </button>
                      {(r.changeRevisionCount ?? 0) > 0 ||
                      r.requestSnapshot ||
                      (!r.id.startsWith("pending-") &&
                        !isRowApprovalLocked(r.approvalState)) ? (
                        <button
                          type="button"
                          className="portal-action-btn"
                          onClick={() => setHistoryRow(r)}
                        >
                          <History size={14} aria-hidden />
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
                            className="portal-action-btn"
                            onClick={() => prefillFromRejected(r)}
                          >
                            <RotateCcw size={14} aria-hidden />
                            Perbaiki
                          </button>
                        )}
                      {(isAdmin || isLeadership) &&
                        !r.id.startsWith("pending-") &&
                        !isRowApprovalLocked(r.approvalState) && (
                          <button
                            type="button"
                            className="portal-action-btn"
                            disabled={busy}
                            onClick={() => void openEdit(r)}
                          >
                            <Pencil size={14} aria-hidden />
                            Edit
                          </button>
                        )}
                      {isLeadership &&
                        !r.id.startsWith("pending-") &&
                        !isRowApprovalLocked(r.approvalState) && (
                          <button
                            type="button"
                            className="portal-action-btn portal-action-btn--danger"
                            disabled={busy}
                            onClick={() => void onDeleteEmployee(r)}
                          >
                            <Trash2 size={14} aria-hidden />
                            Hapus
                          </button>
                        )}
                      {r.approvalState === "pending" &&
                        isLeadership &&
                        r.requestId &&
                        r.pendingAction === "BLACKLIST" && (
                          <>
                            <button
                              type="button"
                              className="portal-action-btn portal-action-btn--primary"
                              disabled={busy}
                              onClick={() => openApproveBlacklistModal(r)}
                            >
                              <Check size={14} aria-hidden />
                              Setujui &amp; bayar
                            </button>
                            <button
                              type="button"
                              className="portal-action-btn portal-action-btn--danger"
                              disabled={busy}
                              onClick={() => void onRejectBlacklist(r.requestId!)}
                            >
                              <XCircle size={14} aria-hidden />
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
                              className="portal-action-btn portal-action-btn--primary"
                              disabled={busy}
                              onClick={() => void onApprovePending(r.requestId!)}
                            >
                              <Check size={14} aria-hidden />
                              Setujui
                            </button>
                            <button
                              type="button"
                              className="portal-action-btn portal-action-btn--danger"
                              disabled={busy}
                              onClick={() => void onRejectPending(r.requestId!)}
                            >
                              <XCircle size={14} aria-hidden />
                              Tolak
                            </button>
                          </>
                        )}
                      {!isRowApprovalLocked(r.approvalState) &&
                        !r.id.startsWith("pending-") &&
                        !r.hasBlacklist && (
                          <button
                            type="button"
                            className="portal-action-btn"
                            onClick={() => openBlacklistModal(r)}
                          >
                            <ShieldAlert size={14} aria-hidden />
                            Sanggahkan
                          </button>
                        )}
                      {!isRowApprovalLocked(r.approvalState) &&
                        !r.id.startsWith("pending-") &&
                        r.hasBlacklist &&
                        r.blacklistId && (
                          <button
                            type="button"
                            className="portal-action-btn portal-action-btn--danger"
                            disabled={busy}
                            onClick={() => onCancelBl(r.blacklistId!)}
                          >
                            <X size={14} aria-hidden />
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
        </div>
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
      </section>

      {showDeletedHistory ? (
        <section
          className="portal-table-section portal-deleted-history"
          aria-labelledby="employee-deleted-heading"
        >
          <div className="portal-table-section-head">
            <h2 id="employee-deleted-heading">Riwayat hapus karyawan</h2>
            <p className="register-field-hint portal-deleted-history-hint">
              Data yang dihapus Pimpinan (Master) — tidak tampil di daftar aktif.
            </p>
          </div>
          {deletedLoading ? (
            <div className="portal-table-loading">
              <Loader2 className="animate-spin" size={24} aria-hidden />
              <span>Memuat riwayat hapus…</span>
            </div>
          ) : (
            <div className="portal-table-wrap">
              <table className="portal-table portal-table-employees">
                <thead>
                  <tr>
                    <th scope="col">Nama</th>
                    <th scope="col">NIK</th>
                    <th scope="col">Posisi</th>
                    <th scope="col">Dihapus pada</th>
                    <th scope="col">Dihapus oleh</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="portal-table-empty">
                        Belum ada karyawan yang dihapus.
                      </td>
                    </tr>
                  ) : (
                    deletedRows.map((r) => (
                      <tr key={r.id}>
                        <td className="portal-table-name">{r.employeeName}</td>
                        <td className="portal-table-mono">
                          {r.nationalIdNumber ?? "—"}
                        </td>
                        <td>{r.position ?? "—"}</td>
                        <td>{formatPortalDate(r.deletedAt)}</td>
                        <td>
                          {r.deletedBy
                            ? `${r.deletedBy.fullName} (${r.deletedBy.publicLoginId})`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {detailRow && (
        <EmployeeDetailModal
          companyId={companyId}
          token={token}
          recordId={
            detailRow.id.startsWith("pending-") ? null : detailRow.id
          }
          requestId={detailRow.requestId}
          rejectionReason={detailRow.rejectionReason}
          hasBlacklist={
            detailRow.hasBlacklist || detailRow.pendingAction === "BLACKLIST"
          }
          blacklistNote={
            detailRow.blacklistNote ??
            (detailRow.requestSnapshot?.payload?.note as string | undefined) ??
            null
          }
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
              await listSwal.fire({
                icon: "info",
                title: "Pengajuan perubahan",
                text:
                  "Perubahan dikirim ke Pimpinan. Setelah disetujui, data langsung diperbarui.",
                confirmButtonColor: "#2459df",
              });
            } else {
              await listSwal.fire({
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
                {submitsSanggahanForApproval
                  ? "Pengajuan dikirim ke pimpinan. Setelah disetujui, pimpinan melakukan transfer sesuai instruksi pembayaran."
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
                <span
                  className={
                    blNote.trim().length < 10
                      ? "portal-field-hint portal-field-hint-warn"
                      : "portal-field-hint portal-field-hint-ok"
                  }
                >
                  {blNote.trim().length < 10
                    ? `Minimal 10 karakter (kurang ${10 - blNote.trim().length})`
                    : `${blNote.trim().length} karakter — siap dikirim`}
                </span>
              </label>
              {showSanggahanFeeAndVoucher && (
                <>
                  {blFeeIdr != null && (
                    <p className="portal-fee-line">
                      Biaya sanggahan karyawan:{" "}
                      {blVoucherQuote && blVoucherQuote.discountAmount > 0 ? (
                        <>
                          <s>Rp {blFeeIdr.toLocaleString("id-ID")}</s>{" "}
                          <strong>
                            Rp{" "}
                            {blVoucherQuote.finalAmount.toLocaleString("id-ID")}
                          </strong>
                          <span className="portal-field-hint">
                            {" "}
                            (hemat Rp{" "}
                            {blVoucherQuote.discountAmount.toLocaleString(
                              "id-ID",
                            )}
                            )
                          </span>
                        </>
                      ) : (
                        <strong>Rp {blFeeIdr.toLocaleString("id-ID")}</strong>
                      )}
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
                    {blVoucherQuoteError ? (
                      <span className="portal-field-hint portal-field-hint-warn">
                        {blVoucherQuoteError}
                      </span>
                    ) : null}
                    {blVoucherLoadIssue ? (
                      <span className="portal-field-hint portal-field-hint-warn">
                        Voucher tidak dapat dimuat: {blVoucherLoadIssue}
                      </span>
                    ) : blVoucherOptions.length === 0 ? (
                      <span className="portal-field-hint">
                        Tidak ada voucher yang bisa dipakai untuk PT ini (belum
                        dibuat, sudah kedaluwarsa, kuota habis, atau PT belum
                        masuk daftar eligibilitas). Minta Owner periksa menu
                        voucher &quot;Sanggahan karyawan&quot;.
                      </span>
                    ) : null}
                  </label>
                </>
              )}
              {requiresManualBankOnSubmit && (
                <>
                  <ManualBankAccountPicker
                    accounts={manualBank.accounts}
                    value={manualBank.selectedId}
                    onChange={manualBank.setSelectedId}
                    disabled={busy || manualBank.loading}
                  />
                  {manualBank.error ? (
                    <p className="explore-error">{manualBank.error}</p>
                  ) : null}
                </>
              )}
              {error && <p className="explore-error">{error}</p>}
              <div className="doc-actions">
                <button
                  type="button"
                  className="button button-blue"
                  disabled={
                    busy ||
                    (requiresManualBankOnSubmit &&
                      !manualBank.ready &&
                      !manualBank.loading)
                  }
                  onClick={() => void onBlacklist()}
                >
                  {busy
                    ? "Memproses…"
                    : submitsSanggahanForApproval
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
