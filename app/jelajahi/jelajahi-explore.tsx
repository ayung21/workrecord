"use client";

import Link from "@/components/app-link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Loader2,
  LockKeyhole,
  Menu,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import {
  fetchCompanyPublic,
  fetchEmployeeRecord,
  fetchExploreRecords,
  type EmployeeRecordView,
} from "@/lib/api/records";
import {
  VerificationRecordModal,
  type VerificationModalCopy,
} from "@/components/explore/verification-record-modal";
import { HeaderAuthLink } from "@/components/header-auth-link";
import { AUTH_CHANGE_EVENT, getAccessToken } from "@/lib/auth/session";

const copy = {
  id: {
    navExplore: "Jelajahi record",
    nav: ["Tentang", "Solusi", "Cara kerja", "Paket"],
    back: "Beranda",
    title: "Jelajahi riwayat kerja",
    subtitle:
      "Semua record yang dapat dijelajahi publik ditampilkan di bawah. Gunakan filter untuk mempersempit daftar. Tanpa akses berbayar, detail tetap terbatas (blur).",
    viewToken: "Token akses lihat (opsional)",
    applyToken: "Terapkan token",
    nameFilter: "Filter nama karyawan",
    companyFilter: "Filter perusahaan",
    reload: "Muat ulang data",
    searching: "Memuat…",
    company: "Perusahaan",
    results: "Record karyawan",
    totalLoaded: "ditampilkan dari",
    noResults: "Tidak ada record yang cocok dengan filter.",
    noData: "Belum ada record yang dapat ditampilkan.",
    error: "Gagal memuat data",
    blurred: "Akses terbatas",
    blurredHint:
      "Beli akses lihat atau masuk dengan akun berlangganan untuk melihat detail lengkap.",
    full: "Akses penuh",
    position: "Jabatan",
    period: "Periode",
    conduct: "Catatan perusahaan",
    violations: "Catatan pelanggaran",
    openDetail: "Lihat detail",
    closeDetail: "Tutup",
    present: "Sekarang",
    filterHint: "Filter hanya menyaring tampilan, tidak menghapus data dari server.",
    modal: {
      modalTitle: "HASIL VERIFIKASI RIWAYAT KERJA",
      searching: "Memuat…",
      blurredHint:
        "Beli akses lihat atau masuk dengan akun berlangganan untuk melihat detail lengkap.",
      present: "Sekarang",
      verified: "TERVERIFIKASI",
      workRecordId: "WorkRecord ID",
      nik: "NIK",
      birthDate: "Tempat, tgl. lahir",
      historyCount: "Riwayat Kerja Terdaftar",
      historyCountSuffix: "Perusahaan",
      employmentHistory: "RIWAYAT PEKERJAAN",
      companyVerified: "VERIFIED",
      role: "Jabatan",
      startDate: "Mulai",
      endDate: "Berakhir",
      status: "Status",
      statusActive: "Masih Aktif Bekerja",
      statusEnded: "Hubungan Kerja Telah Berakhir",
      note: "Keterangan",
      recordStatus: "STATUS RECORD",
      recordVerified: "Telah diverifikasi perusahaan",
      employeeDispute: "SANGGAHAN PEKERJA",
      disputeYes: "ADA",
      disputeNo: "TIDAK ADA",
      disputeBody:
        "Terdapat sanggahan pekerja terhadap sebagian informasi dalam record ini.",
      disputeHidden: "Detail sanggahan tidak ditampilkan.",
      disputeClarify:
        "Silakan lakukan klarifikasi kepada perusahaan pemberi record.",
      contactCompany: "HUBUNGI PERUSAHAAN SEBELUMNYA",
      notAvailable: "—",
    } satisfies VerificationModalCopy,
  },
  en: {
    navExplore: "Explore records",
    nav: ["About", "Solutions", "How it works", "Plans"],
    back: "Home",
    title: "Explore work history",
    subtitle:
      "All publicly explorable records are listed below. Use filters to narrow the list. Without paid access, details stay limited (blurred).",
    viewToken: "View access token (optional)",
    applyToken: "Apply token",
    nameFilter: "Filter by employee name",
    companyFilter: "Filter by company",
    reload: "Reload data",
    searching: "Loading…",
    company: "Company",
    results: "Employee records",
    totalLoaded: "shown of",
    noResults: "No records match your filters.",
    noData: "No records available to display yet.",
    error: "Could not load data",
    blurred: "Limited access",
    blurredHint:
      "Purchase view access or sign in with a subscribed account for full details.",
    full: "Full access",
    position: "Role",
    period: "Period",
    conduct: "Company note",
    violations: "Violation notes",
    openDetail: "View details",
    closeDetail: "Close",
    present: "Present",
    filterHint: "Filters only change what you see; they do not remove data from the server.",
    modal: {
      modalTitle: "WORK HISTORY VERIFICATION RESULT",
      searching: "Loading…",
      blurredHint:
        "Purchase view access or sign in with a subscribed account for full details.",
      present: "Present",
      verified: "VERIFIED",
      workRecordId: "WorkRecord ID",
      nik: "National ID",
      birthDate: "Place & date of birth",
      historyCount: "Registered employment history",
      historyCountSuffix: "companies",
      employmentHistory: "EMPLOYMENT HISTORY",
      companyVerified: "VERIFIED",
      role: "Role",
      startDate: "Start",
      endDate: "End",
      status: "Status",
      statusActive: "Currently employed",
      statusEnded: "Employment has ended",
      note: "Notes",
      recordStatus: "RECORD STATUS",
      recordVerified: "Verified by the company",
      employeeDispute: "EMPLOYEE DISPUTE",
      disputeYes: "YES",
      disputeNo: "NONE",
      disputeBody:
        "The employee has disputed part of the information in this record.",
      disputeHidden: "Dispute details are not shown.",
      disputeClarify:
        "Please clarify with the company that provided the record.",
      contactCompany: "CONTACT PREVIOUS COMPANY",
      notAvailable: "—",
    } satisfies VerificationModalCopy,
  },
};

const sectionAnchors = ["tentang", "solusi", "cara-kerja"];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="WorkRecord">
      <span className="brand-mark">
        <CheckCheck strokeWidth={3} size={25} />
      </span>
      <span>
        work<span className="font-normal">record</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

export default function JelajahiExplore() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"id" | "en">("id");
  const [menu, setMenu] = useState(false);
  const t = copy[lang];

  const [viewTokenInput, setViewTokenInput] = useState(
    () => searchParams.get("viewToken") ?? "",
  );
  const [nameQuery, setNameQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [companyQuery, setCompanyQuery] = useState(
    () => searchParams.get("company") ?? "",
  );

  const [records, setRecords] = useState<EmployeeRecordView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<EmployeeRecordView | null>(null);
  const [detail, setDetail] = useState<EmployeeRecordView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [companyPhone, setCompanyPhone] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setDetail(null);

    try {
      const list = await fetchExploreRecords({
        viewToken: viewTokenInput.trim() || undefined,
        token: getAccessToken() ?? undefined,
      });
      setRecords(list);
    } catch (e) {
      setRecords([]);
      setError(e instanceof ApiRequestError ? e.message : t.error);
    } finally {
      setLoading(false);
    }
  }, [viewTokenInput, t.error]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    const onAuth = () => void loadAll();
    window.addEventListener(AUTH_CHANGE_EVENT, onAuth);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, onAuth);
  }, [loadAll]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (viewTokenInput.trim()) {
      params.set("viewToken", viewTokenInput.trim());
    }
    if (nameQuery.trim()) params.set("q", nameQuery.trim());
    if (companyQuery.trim()) params.set("company", companyQuery.trim());
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      qs ? `/jelajahi?${qs}` : "/jelajahi",
    );
  }, [viewTokenInput, nameQuery, companyQuery]);

  const filteredRecords = useMemo(() => {
    const nameQ = nameQuery.trim().toLowerCase();
    const companyQ = companyQuery.trim().toLowerCase();
    return records.filter((r) => {
      const nameOk =
        !nameQ || r.employeeName.toLowerCase().includes(nameQ);
      const companyOk =
        !companyQ ||
        (r.companyName?.toLowerCase().includes(companyQ) ?? false);
      return nameOk && companyOk;
    });
  }, [records, nameQuery, companyQuery]);

  const openDetail = async (record: EmployeeRecordView) => {
    const companyId = record.companyId;
    if (!companyId) return;
    setSelected(record);
    setDetailLoading(true);
    setCompanyPhone(null);
    try {
      const [one, company] = await Promise.all([
        fetchEmployeeRecord(companyId, record.id, {
          viewToken: viewTokenInput.trim() || undefined,
          token: getAccessToken() ?? undefined,
        }),
        fetchCompanyPublic(companyId).catch(() => null),
      ]);
      setDetail(one);
      setCompanyPhone(company?.companyPhone ?? null);
    } catch (e) {
      setDetail(null);
      setError(e instanceof ApiRequestError ? e.message : t.error);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="site-shell explore-page">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <nav
            className="desktop-nav"
            aria-label={lang === "id" ? "Navigasi utama" : "Main navigation"}
          >
            <Link href="/jelajahi" className="nav-active">
              {t.navExplore}
            </Link>
            {t.nav.map((label, i) => (
              <Link key={label} href={`/#${sectionAnchors[i]}`}>
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <div className="language" aria-label="Language">
              <button
                type="button"
                aria-pressed={lang === "id"}
                onClick={() => setLang("id")}
              >
                ID
              </button>
              <span>/</span>
              <button
                type="button"
                aria-pressed={lang === "en"}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
            <HeaderAuthLink lang={lang} />
            <Link className="button button-dark header-cta" href="/">
              {t.back}
              <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="mobile-toggle"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav">
            <Link href="/jelajahi" onClick={() => setMenu(false)}>
              {t.navExplore}
            </Link>
            {t.nav.map((label, i) => (
              <Link
                key={label}
                href={`/#${sectionAnchors[i]}`}
                onClick={() => setMenu(false)}
              >
                {label}
              </Link>
            ))}
            <HeaderAuthLink
              lang={lang}
              onNavigate={() => setMenu(false)}
              className="mobile-nav-auth"
            />
          </nav>
        )}
      </header>

      <main className="explore-main">
        <div className="container explore-layout explore-layout-wide">
          <div className="explore-intro">
            <Link href="/" className="explore-back">
              <ArrowLeft size={16} />
              {t.back}
            </Link>
            <p className="eyebrow">
              <span className="eyebrow-line" />
              WORKRECORD / EXPLORE
            </p>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>

          <div className="explore-toolbar">
            <div className="explore-filters">
              <label>
                <span>{t.nameFilter}</span>
                <input
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder={lang === "id" ? "Contoh: Andi" : "e.g. Andi"}
                />
              </label>
              <label>
                <span>{t.companyFilter}</span>
                <input
                  value={companyQuery}
                  onChange={(e) => setCompanyQuery(e.target.value)}
                  placeholder={
                    lang === "id" ? "Contoh: Contoh Maju" : "e.g. Contoh Maju"
                  }
                />
              </label>
            </div>
            <p className="explore-filter-hint">{t.filterHint}</p>

            <form
              className="explore-token-row"
              onSubmit={(e) => {
                e.preventDefault();
                void loadAll();
              }}
            >
              <label>
                <span>{t.viewToken}</span>
                <input
                  value={viewTokenInput}
                  onChange={(e) => setViewTokenInput(e.target.value)}
                  placeholder={
                    lang === "id" ? "Dari email akses lihat" : "From view-access email"
                  }
                  autoComplete="off"
                />
              </label>
              <button
                type="submit"
                className="button button-outline"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}
                {loading ? t.searching : t.applyToken}
              </button>
            </form>
          </div>

          {error && (
            <p className="explore-error" role="alert">
              {error}
            </p>
          )}

          <section className="explore-results" aria-live="polite">
            <h2>
              {t.results}{" "}
              <span className="explore-count">
                {loading
                  ? "…"
                  : `${filteredRecords.length} ${t.totalLoaded} ${records.length}`}
              </span>
            </h2>

            {loading ? (
              <div className="explore-detail-loading explore-list-loading">
                <Loader2 className="animate-spin" size={32} />
                <span>{t.searching}</span>
              </div>
            ) : records.length === 0 ? (
              <p className="explore-muted">{t.noData}</p>
            ) : filteredRecords.length === 0 ? (
              <p className="explore-muted">{t.noResults}</p>
            ) : (
              <ul className="explore-list">
                {filteredRecords.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      className={`explore-card ${record.visibility === "blurred" ? "explore-card-blurred" : ""}`}
                      onClick={() => void openDetail(record)}
                    >
                      <div className="explore-card-top">
                        <strong>{record.employeeName}</strong>
                        <span
                          className={
                            record.visibility === "full"
                              ? "explore-badge-full"
                              : "explore-badge-blur"
                          }
                        >
                          {record.visibility === "full" ? (
                            <>
                              <ShieldCheck size={12} />
                              {t.full}
                            </>
                          ) : (
                            <>
                              <LockKeyhole size={12} />
                              {t.blurred}
                            </>
                          )}
                        </span>
                      </div>
                      {record.companyName && (
                        <p className="explore-card-company">{record.companyName}</p>
                      )}
                      {record.position && (
                        <p className="explore-card-meta">{record.position}</p>
                      )}
                      <span className="explore-card-link">
                        {t.openDetail}
                        <ArrowUpRight size={14} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <VerificationRecordModal
            open={selected !== null}
            onOpenChange={(open) => {
              if (!open) {
                setSelected(null);
                setDetail(null);
                setCompanyPhone(null);
              }
            }}
            loading={detailLoading}
            detail={detail}
            anchor={selected}
            allRecords={records}
            companyPhone={companyPhone}
            lang={lang}
            copy={t.modal}
          />
        </div>
      </main>
    </div>
  );
}
