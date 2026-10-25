"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchManualPaymentBankAccounts,
  type ManualPaymentBankAccount,
} from "@/lib/api/manual-payment";

export function useManualBankSelection() {
  const [accounts, setAccounts] = useState<ManualPaymentBankAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchManualPaymentBankAccounts()
      .then((rows) => {
        if (cancelled) return;
        setAccounts(rows);
        if (rows.length === 1) setSelectedId(rows[0].id);
      })
      .catch(() => {
        if (!cancelled) setError("Gagal memuat daftar rekening pembayaran.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const needsSelection = accounts.length > 1;

  const ready = useMemo(() => {
    if (loading) return false;
    if (accounts.length === 0) return false;
    if (accounts.length === 1) return true;
    return Boolean(selectedId);
  }, [accounts.length, loading, selectedId]);

  const validateSelection = (): string | null => {
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
