"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { PortalShell } from "@/components/company/portal-shell";
import { CompanyVerificationPanel } from "@/components/company/company-verification-panel";
import { useCompanyPortalStatus } from "@/components/company/company-portal-status";
import { getAccessToken } from "@/lib/auth/session";
import {
  fetchCompanyDocumentFile,
  fetchCompanySettings,
  fetchMyCompany,
  requestSiteVerification,
  submitVerification,
  updateCompanySettings,
  uploadCompanyDocument,
  type CompanyVerification,
} from "@/lib/api/company-portal";
import { ApiErrorDialog } from "@/components/company/api-error-dialog";
import { formatApiErrorMessage } from "@/lib/api/client";
import { validateCompanyDocumentFile } from "@/lib/company/document-upload";

export default function VerifikasiPage() {
  const accessToken = getAccessToken();
  const {
    isActive,
    loading: statusLoading,
    refresh: refreshPortalStatus,
  } = useCompanyPortalStatus();
  const [verification, setVerification] = useState<CompanyVerification | null>(
    null,
  );
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [businessField, setBusinessField] = useState("");
  const [canEditBusinessField, setCanEditBusinessField] = useState(false);
  const [businessFieldError, setBusinessFieldError] = useState<string | null>(
    null,
  );
  const [businessFieldBusy, setBusinessFieldBusy] = useState(false);
  const businessFieldSaveLock = useRef(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const showError = (err: unknown) => {
    setErrorModal(formatApiErrorMessage(err));
  };

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMyCompany(accessToken);
        if (cancelled) return;
        setCompanyId(String(me.id));
        setCompanyName(me.name ?? "");
        setVerification(me.verification);
        try {
          const settings = await fetchCompanySettings(String(me.id), accessToken);
          if (!cancelled) {
            setBusinessField(settings.businessField ?? "");
            setCanEditBusinessField(settings.canEditBusinessField ?? false);
          }
        } catch {
          /* settings optional jika endpoint belum tersedia */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const reload = async () => {
    if (!accessToken) return;
    const me = await fetchMyCompany(accessToken);
    setCompanyId(String(me.id));
    setCompanyName(me.name ?? "");
    setVerification(me.verification);
    if (companyId || me.id) {
      const settings = await fetchCompanySettings(String(me.id), accessToken);
      setBusinessField(settings.businessField ?? "");
      setCanEditBusinessField(settings.canEditBusinessField ?? false);
    }
    await refreshPortalStatus();
  };

  const onSaveBusinessField = async () => {
    if (!accessToken || !companyId || !canEditBusinessField) return;
    if (businessFieldSaveLock.current || businessFieldBusy) return;
    const trimmed = businessField.trim();
    if (trimmed.length > 0 && trimmed.length < 2) {
      setBusinessFieldError("Bidang usaha minimal 2 karakter.");
      return;
    }
    businessFieldSaveLock.current = true;
    setBusinessFieldBusy(true);
    setBusinessFieldError(null);
    try {
      const updated = await updateCompanySettings(companyId, accessToken, {
        businessField: trimmed,
      });
      setBusinessField(updated.businessField ?? "");
      setCanEditBusinessField(updated.canEditBusinessField ?? false);
      await Swal.fire({
        icon: "success",
        title: "Tersimpan",
        text: "Bidang usaha perusahaan diperbarui.",
        confirmButtonColor: "#2459df",
      });
    } catch (err) {
      setBusinessFieldError(formatApiErrorMessage(err));
    } finally {
      businessFieldSaveLock.current = false;
      setBusinessFieldBusy(false);
    }
  };

  const onUpload = async (type: string, file: File) => {
    if (!accessToken || !companyId) return;
    const validationError = validateCompanyDocumentFile(type, file);
    if (validationError) {
      setErrorModal(validationError);
      return;
    }
    setBusy(true);
    try {
      await uploadCompanyDocument(companyId, type, file, accessToken);
      await reload();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const onPreview = async (type: string) => {
    if (!accessToken || !companyId) return;
    setBusy(true);
    try {
      const { blob, contentType } = await fetchCompanyDocumentFile(
        companyId,
        type,
        accessToken,
      );
      const url = URL.createObjectURL(
        new Blob([await blob.arrayBuffer()], {
          type: contentType || blob.type || "application/octet-stream",
        }),
      );
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!accessToken || !companyId) return;
    setBusy(true);
    try {
      const v = await submitVerification(companyId, accessToken);
      setVerification(v);
      await refreshPortalStatus();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  const onRequestSite = async (input: {
    method: "VIDEO_CALL" | "ON_SITE";
    contactName: string;
    contactPhone: string;
    address: string;
    preferredScheduleNote?: string;
  }) => {
    if (!accessToken || !companyId) return;
    setBusy(true);
    try {
      const v = await requestSiteVerification(companyId, accessToken, input);
      setVerification(v);
      await refreshPortalStatus();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell>
      <div className="explore-intro company-verify-intro">
        <h1>Verifikasi perusahaan</h1>
        <p>
          Lengkapi dokumen legal, atur bidang usaha, lalu verifikasi lapangan
          (video call atau kunjungan). Setelah aktif, menu Cari NIK, List,
          Report, dan Iklan terbuka.
        </p>
      </div>
      {loading ? (
        <div className="company-verify-loading">
          <Loader2 className="animate-spin" size={28} />
          <p>Memuat status verifikasi…</p>
        </div>
      ) : verification ? (
        <CompanyVerificationPanel
          companyName={companyName}
          verification={verification}
          busy={busy}
          showLockedNotice={!statusLoading && !isActive}
          businessField={businessField}
          canEditBusinessField={canEditBusinessField}
          businessFieldBusy={businessFieldBusy}
          businessFieldError={businessFieldError}
          onBusinessFieldChange={setBusinessField}
          onSaveBusinessField={() => void onSaveBusinessField()}
          onUpload={(type, file) => void onUpload(type, file)}
          onPreview={(type) => void onPreview(type)}
          onSubmitReview={() => void onSubmit()}
          onRequestSite={(input) => void onRequestSite(input)}
        />
      ) : (
        <div className="card explore-error-block">
          <p>Login sebagai akun perusahaan untuk mengunggah dokumen.</p>
        </div>
      )}
      <ApiErrorDialog
        open={Boolean(errorModal)}
        message={errorModal ?? ""}
        onOpenChange={(open) => {
          if (!open) setErrorModal(null);
        }}
      />
    </PortalShell>
  );
}
