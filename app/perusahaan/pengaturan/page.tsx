"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Settings } from "lucide-react";
import Swal from "sweetalert2";
import { PortalShell } from "@/components/company/portal-shell";
import { readSession } from "@/lib/auth/session";
import {
  fetchCompanySettings,
  updateCompanySettings,
  type CompanySettings,
} from "@/lib/api/company-portal";
import { formatApiErrorMessage } from "@/lib/api/client";

export default function PengaturanPerusahaanPage() {
  const session = readSession();
  const token = session?.accessToken ?? null;
  const companyId = session?.user.companyId ?? null;
  const isLeadership = session?.user.accountType === "LEADERSHIP";
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const saveLock = useRef(false);

  useEffect(() => {
    if (!token || !companyId || !isLeadership) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCompanySettings(companyId, token);
        if (cancelled) return;
        setSettings(data);
        setAdminEmail(data.adminAccount.email);
        setCompanyPhone(data.companyPhone ?? "");
        setError(null);
      } catch (err) {
        if (!cancelled) setError(formatApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, companyId, isLeadership]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !companyId || !settings) return;
    if (saveLock.current || busy) return;

    const emailTrim = adminEmail.trim();
    const phoneTrim = companyPhone.trim();
    const emailChanged =
      emailTrim.toLowerCase() !== settings.adminAccount.email.toLowerCase();
    const phoneChanged = phoneTrim !== (settings.companyPhone ?? "");

    if (!emailChanged && !phoneChanged) {
      setError("Tidak ada perubahan.");
      return;
    }

    saveLock.current = true;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateCompanySettings(companyId, token, {
        ...(emailChanged ? { adminEmail: emailTrim } : {}),
        ...(phoneChanged ? { companyPhone: phoneTrim } : {}),
      });
      setSettings(updated);
      setAdminEmail(updated.adminAccount.email);
      setCompanyPhone(updated.companyPhone ?? "");

      if (emailChanged && updated.adminAccount.pendingEmail) {
        await Swal.fire({
          icon: "info",
          title: "Cek email Admin",
          html: `Link verifikasi dikirim ke <strong>${updated.adminAccount.pendingEmail}</strong>. Email login Admin baru aktif setelah tautan diklik (24 jam).`,
          confirmButtonColor: "#2459df",
        });
      } else {
        await Swal.fire({
          icon: "success",
          title: "Tersimpan",
          text: "Data akun Admin diperbarui.",
          confirmButtonColor: "#2459df",
        });
      }
    } catch (err) {
      setError(formatApiErrorMessage(err));
    } finally {
      saveLock.current = false;
      setBusy(false);
    }
  };

  return (
    <PortalShell>
      <h1>Pengaturan</h1>
      <p className="register-hint">
        Hanya akun Pimpinan (Master/Atasan). Kelola email akun Admin dan
        nomor telepon perusahaan (tampil di verifikasi keanggotaan & sanggahan
        lintas PT).
      </p>

      {loading ? (
        <p className="explore-muted portal-loading-inline">
          <Loader2 className="animate-spin" size={18} aria-hidden /> Memuat…
        </p>
      ) : !token || !companyId ? (
        <p className="explore-error">Silakan login sebagai akun perusahaan.</p>
      ) : !isLeadership ? (
        <p className="explore-error">
          Menu ini hanya untuk akun Pimpinan (Master). Admin tidak dapat
          mengubah pengaturan ini.
        </p>
      ) : (
        <section className="register-section-card portal-settings-card">
          <h2>
            <span className="register-section-icon" aria-hidden>
              <Settings size={18} />
            </span>
            Akun Admin perusahaan
          </h2>

          {settings ? (
            <dl className="portal-settings-readonly">
              <div>
                <dt>Nama Admin</dt>
                <dd>{settings.adminAccount.fullName}</dd>
              </div>
              <div>
                <dt>ID login Admin</dt>
                <dd>{settings.adminAccount.publicLoginId}</dd>
              </div>
            </dl>
          ) : null}

          {settings?.adminAccount.pendingEmail ? (
            <p className="portal-notice register-full" role="status">
              Menunggu verifikasi email ke{" "}
              <strong>{settings.adminAccount.pendingEmail}</strong>. Minta Admin
              membuka inbox (dan spam) lalu klik tautan verifikasi.
            </p>
          ) : null}

          <form className="register-grid portal-modal-form" onSubmit={onSave}>
            <label className="register-full">
              <span>Email Admin</span>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                autoComplete="off"
                disabled={busy}
              />
              <span className="register-field-hint">
                Jika diubah, verifikasi dikirim ke email baru sebelum login
                berganti.
              </span>
            </label>
            <label className="register-full">
              <span>Telepon perusahaan</span>
              <input
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                required
                minLength={8}
                placeholder="021…"
                disabled={busy}
              />
              <span className="register-field-hint">
                Nomor kontak resmi PT — ditampilkan saat perusahaan lain
                melihat sanggahan.
              </span>
            </label>
            {error ? (
              <p className="explore-error register-full" role="alert">
                {error}
              </p>
            ) : null}
            <div className="register-full register-form-actions">
              <button
                type="submit"
                className="button button-blue"
                disabled={busy}
              >
                {busy ? "Menyimpan…" : "Simpan pengaturan"}
              </button>
            </div>
          </form>
        </section>
      )}
    </PortalShell>
  );
}
