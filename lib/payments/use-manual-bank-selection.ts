"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchManualPaymentBankAccounts,
  type ManualPaymentBankAccount,
} from "@/lib/api/manual-payment";

export function useManualBankSelection() {
  const [accounts, setAccounts] = useState<ManualPaymentBankAccount[]>([]);
  /** null = belum diketahui. Jangan anggap manual sebelum respons API masuk. */
  const [gateway, setGateway] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchManualPaymentBankAccounts()
      .then((res) => {
        if (cancelled) return;
        setGateway(res.gateway);
        setAccounts(res.accounts);
        if (res.accounts.length === 1) setSelectedId(res.accounts[0].id);
      })
      .catch(() => {
        if (cancelled) return;
        // Gagal memuat bukan berarti transfer manual. Jangan mengunci tombol bayar.
        setGateway("unknown");
        setError("Gagal memuat metode pembayaran. Coba lagi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isManualGateway = gateway === "manual";

  const needsSelection = isManualGateway && accounts.length > 1;

  const ready = useMemo(() => {
    if (!isManualGateway) return !loading;
    if (loading) return false;
    if (accounts.length === 0) return false;
    if (accounts.length === 1) return true;
    return Boolean(selectedId);
  }, [accounts.length, isManualGateway, loading, selectedId]);

  const validateSelection = (): string | null => {
    if (!isManualGateway) return null;
    if (loading) return "Memuat rekening tujuan…";
    if (accounts.length === 0) {
      return "Rekening pembayaran belum dikonfigurasi. Hubungi admin WorkRecord.";
    }
    if (needsSelection && !selectedId) {
      return "Pilih rekening tujuan transfer.";
    }
    return null;
  };

  const selectedAccountId = accounts.length === 1 ? accounts[0].id : selectedId;

  return {
    accounts,
    gateway,
    isManualGateway,
    selectedId,
    setSelectedId,
    selectedAccountId,
    needsSelection,
    loading,
    error,
    ready,
    validateSelection,
  };
}
