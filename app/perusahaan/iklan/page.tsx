"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { PortalShell } from "@/components/company/portal-shell";
import { readSession } from "@/lib/auth/session";
import { checkoutCompanyAd } from "@/lib/api/ads";
import { mockCompletePayment } from "@/lib/api/companies";
import { ApiRequestError } from "@/lib/api/client";
import { fetchPricingCatalog, type PricingCatalog } from "@/lib/api/pricing";
import { HERO_BANNER_IMAGE_SPEC } from "@/lib/ads/display";

const PREVIEW_GRADIENT =
  "linear-gradient(120deg, #142442 0%, #2459df 55%, #3b7cff 100%)";

export default function CompanyAdsPage() {
  const session = readSession();
  const token = session?.accessToken ?? "";
  const [catalog, setCatalog] = useState<PricingCatalog | null>(null);
  const [adPackageId, setAdPackageId] = useState("");
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    ctaLabel: "Pelajari",
    ctaUrl: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPricingCatalog()
      .then((c) => {
        setCatalog(c);
        if (c.adPackages[0]) setAdPackageId(c.adPackages[0].id);
      })
      .catch(() => setCatalog(null));
  }, []);

  const selectedPkg = catalog?.adPackages.find((p) => p.id === adPackageId);

  const previewTitle = form.title.trim() || "Judul iklan Anda";
  const previewSubtitle =
    form.subtitle.trim() || "Subjudul singkat tampil di sisi kiri banner.";
  const previewCta = form.ctaLabel.trim() || "Pelajari";

  const canSubmit = useMemo(
    () => Boolean(adPackageId && form.title.trim().length >= 3),
    [adPackageId, form.title],
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Silakan login sebagai perusahaan.");
      return;
    }
    if (!adPackageId) {
      setError("Pilih paket iklan terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const checkout = await checkoutCompanyAd(token, {
        adPackageId,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        ctaLabel: form.ctaLabel.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
      });
      await mockCompletePayment(checkout.paymentId);
      setMessage(
        "Pembayaran iklan berhasil (simulasi). Iklan akan tampil setelah diverifikasi sistem.",
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Gagal memesan iklan",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalShell>
      <div className="company-ads-page">
        <header className="company-ads-intro explore-intro">
          <p className="company-ads-eyebrow">
            <Megaphone size={14} aria-hidden />
            Promosi di company profile
          </p>
          <h1>Pasang iklan</h1>
          <p>
            Tampilkan merek Anda di <strong>carousel banner</strong> halaman
            depan WorkRecord. Isi teks dan CTA di bawah; gambar banner (rasio{" "}
            {HERO_BANNER_IMAGE_SPEC.ratio}) diunggah Owner setelah iklan
            terdaftar.
          </p>
        </header>

        {error ? (
          <div className="company-ads-alert company-ads-alert-error" role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            className="company-ads-alert company-ads-alert-success"
            role="status"
          >
            <CheckCircle2 size={20} aria-hidden />
            {message}
          </div>
        ) : null}

        <div className="company-ads-layout">
          <form className="company-ads-form" onSubmit={onSubmit}>
            <section className="company-ads-card">
              <h2 className="company-ads-card-title">
                <Sparkles size={18} aria-hidden />
                Pilih paket
              </h2>
              {!catalog?.adPackages.length ? (
                <p className="explore-muted company-ads-empty">
                  Belum ada paket iklan aktif. Hubungi Owner WorkRecord.
                </p>
              ) : (
                <ul className="company-ads-packages" role="list">
                  {catalog.adPackages.map((p) => {
                    const selected = p.id === adPackageId;
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={
                            selected
                              ? "company-ads-package is-selected"
                              : "company-ads-package"
                          }
                          onClick={() => setAdPackageId(p.id)}
                          aria-pressed={selected}
                        >
                          <span className="company-ads-package-label">
                            {p.label}
                          </span>
                          <span className="company-ads-package-meta">
                            {p.placementLabel} · {p.durationDays} hari
                          </span>
                          <span className="company-ads-package-price">
                            Rp {p.priceIdr.toLocaleString("id-ID")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {selectedPkg?.description ? (
                <p className="company-ads-package-desc">{selectedPkg.description}</p>
              ) : null}
            </section>

            <section className="company-ads-card">
              <h2 className="company-ads-card-title">Konten tampilan</h2>
              <p className="company-ads-card-hint">
                Teks ini muncul di overlay kiri banner (area kanan untuk visual
                gambar).
              </p>
              <div className="company-ads-fields">
                <label className="company-ads-field company-ads-field-wide">
                  <span>Judul iklan</span>
                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Contoh: Solusi rekrut lebih percaya"
                    required
                    minLength={3}
                  />
                </label>
                <label className="company-ads-field company-ads-field-wide">
                  <span>Subjudul</span>
                  <input
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                    placeholder="Satu baris penjelasan singkat"
                  />
                </label>
                <label className="company-ads-field">
                  <span>Label tombol CTA</span>
                  <input
                    value={form.ctaLabel}
                    onChange={(e) =>
                      setForm({ ...form, ctaLabel: e.target.value })
                    }
                    placeholder="Pelajari"
                  />
                </label>
                <label className="company-ads-field">
                  <span>URL tombol</span>
                  <input
                    type="url"
                    value={form.ctaUrl}
                    onChange={(e) =>
                      setForm({ ...form, ctaUrl: e.target.value })
                    }
                    placeholder="https://perusahaan-anda.id"
                  />
                </label>
              </div>
            </section>

            <button
              type="submit"
              className="button button-blue company-ads-submit"
              disabled={busy || !canSubmit}
            >
              {busy ? (
                <Loader2 className="animate-spin" size={18} aria-hidden />
              ) : null}
              Bayar &amp; ajukan iklan
              {!busy ? <ArrowUpRight size={18} aria-hidden /> : null}
            </button>
          </form>

          <aside className="company-ads-aside" aria-label="Pratinjau iklan">
            <div className="company-ads-preview-card">
              <h3 className="company-ads-preview-title">Pratinjau banner</h3>
              <p className="company-ads-preview-note">
                Tanpa gambar — gradien sampai Owner mengunggah visual.
              </p>
              <div className="company-ads-preview-frame">
                <div
                  className="home-ad-banner-slide home-ad-banner-slide-text-only company-ads-preview-slide"
                  style={{ background: PREVIEW_GRADIENT }}
                >
                  <div className="home-ad-banner-scrim" aria-hidden />
                  <div className="home-ad-banner-copy">
                    <span className="home-ad-banner-tag">Iklan</span>
                    <h3>{previewTitle}</h3>
                    <p>{previewSubtitle}</p>
                    <span className="home-ad-banner-cta">
                      {previewCta}
                      <ArrowUpRight size={18} aria-hidden />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="company-ads-spec-card">
              <div className="company-ads-spec-head">
                <ImageIcon size={22} aria-hidden />
                <div>
                  <strong>Gambar banner</strong>
                  <p>
                    {HERO_BANNER_IMAGE_SPEC.width}×{HERO_BANNER_IMAGE_SPEC.height}{" "}
                    px · maks. {HERO_BANNER_IMAGE_SPEC.maxMb} MB · JPG/PNG/WebP
                  </p>
                </div>
              </div>
              <p className="company-ads-spec-tip">
                Diunggah oleh Owner di panel admin setelah pembayaran. Hindari
                teks penting di sisi kanan banner.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </PortalShell>
  );
}
