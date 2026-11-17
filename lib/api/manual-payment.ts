import { apiFetch } from "./client";

export type ManualPaymentBankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label?: string;
};

export type ManualTransferInfo = {
  bankAccountId?: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  label?: string;
  baseAmount: number;
  uniqueCode: number;
  transferAmount: number;
  note: string;
};

export type PaymentCheckoutResult = {
  paymentId: string;
  amount: number;
  originalAmount?: number;
  discountedAmount?: number;
  discountAmount?: number;
  redirectUrl?: string;
  manualTransfer?: ManualTransferInfo;
  qrUrl?: string | null;
  qris?: {
    paymentId: string;
    qrUrl: string | null;
    qrContent: string | null;
    contractId: string | null;
    expiredAt: string | null;
    amount: number;
  };
};

export async function fetchManualPaymentBankAccounts() {
  const res = await apiFetch<{
    gateway?: string;
    accounts: ManualPaymentBankAccount[];
  }>("payments/manual-instructions");
  return {
    gateway: res.gateway ?? "manual",
    accounts: res.accounts ?? [],
  };
}

export function formatIdr(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function manualTransferSummaryLines(info: ManualTransferInfo): string[] {
  return [
    `Bank: ${info.bankName}`,
    `No. rekening: ${info.accountNumber}`,
    `Atas nama: ${info.accountHolder}`,
    `Nominal transfer: ${formatIdr(info.transferAmount)}`,
    `(Harga layanan ${formatIdr(info.baseAmount)} + kode unik ${String(info.uniqueCode).padStart(3, "0")})`,
    info.note,
  ];
}

export function fetchQrisPaymentStatus(token: string, paymentId: string) {
  return apiFetch<{
    status: string;
    paymentId: string;
    latestTransactionStatus?: string | null;
  }>(`payments/${paymentId}/qris-status`, { token });
}

export function fetchStoredQris(token: string, paymentId: string) {
  return apiFetch<{
    status: string;
    paymentId: string;
    qris: PaymentCheckoutResult["qris"];
  }>(`payments/${paymentId}/qris`, { token });
}
