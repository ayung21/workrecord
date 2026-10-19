"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { MemberVerifyPublicView } from "@/components/company/member-verify-public-view";
import {
  fetchPublicMemberVerification,
  type PublicMemberVerification,
} from "@/lib/api/member-verify";
import { formatApiErrorMessage } from "@/lib/api/client";

export default function VerifikasiMemberPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [data, setData] = useState<PublicMemberVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!token) {
      setError("Tautan verifikasi tidak valid.");
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchPublicMemberVerification(token);
      setData(result);
    } catch (err) {
      setData(null);
      setError(formatApiErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void load(false);
  }, [load]);

  if (loading) {
    return (
      <div className="member-verify-page member-verify-page--center">
        <Loader2 className="animate-spin" size={32} aria-hidden />
        <p>Memuat verifikasi keanggotaan…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="member-verify-page member-verify-page--center">
        <div className="member-verify-error card">
          <h1>Verifikasi tidak ditemukan</h1>
          <p>{error ?? "Tautan tidak valid atau keanggotaan tidak aktif."}</p>
        </div>
      </div>
    );
  }

  return (
    <MemberVerifyPublicView
      data={data}
      refreshing={refreshing}
      onRefresh={() => void load(true)}
    />
  );
}
