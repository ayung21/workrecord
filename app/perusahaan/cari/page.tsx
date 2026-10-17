"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { PortalShell } from "@/components/company/portal-shell";
import { readSession } from "@/lib/auth/session";
import { NikSearchResult } from "@/components/company/nik-search-result";
import {
  searchRecordsByNik,
  type DisputingCompanyRef,
  type EmployeeRecordView,
} from "@/lib/api/records";
import { ApiRequestError } from "@/lib/api/client";

export default function CariNikPage() {
  const session = readSession();
  const token = session?.accessToken ?? "";
  const [nik, setNik] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<EmployeeRecordView[]>([]);
  const [disputingCompanies, setDisputingCompanies] = useState<
    DisputingCompanyRef[]
  >([]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Silakan login sebagai perusahaan.");
      return;
    }
    setLoading(true);
    setError(null);
    setItems([]);
    setDisputingCompanies([]);
    try {
      const res = await searchRecordsByNik(nik.trim(), token);
      setItems(res.items);
      setDisputingCompanies(res.disputingCompanies ?? []);
      if (!res.items.length) {
        setError("Tidak ada record untuk NIK tersebut.");
      }
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Pencarian gagal.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PortalShell>
      <div className="explore-intro">
        <h1>Cari riwayat kerja (NIK)</h1>
        <p>
          Hanya perusahaan terverifikasi yang dapat mencari. Masukkan NIK 16
          digit — tidak ada daftar publik.
        </p>
      </div>
      <form className="explore-toolbar" onSubmit={onSearch}>
        <label className="explore-filters">
          <span>NIK</span>
          <input
            value={nik}
            onChange={(e) => setNik(e.target.value)}
            placeholder="16 digit"
            minLength={16}
            required
          />
        </label>
        <button type="submit" className="button button-blue" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          Cari
        </button>
      </form>
      {error && <p className="explore-error">{error}</p>}
      {items.length > 0 && token ? (
        <NikSearchResult
          items={items}
          disputingCompanies={disputingCompanies}
          token={token}
        />
      ) : null}
    </PortalShell>
  );
}
