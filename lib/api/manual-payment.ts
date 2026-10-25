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
  redirectUrl?: string;
  manualTransfer?: ManualTransferInfo;
};

export async function fetchManualPaymentBankAccounts() {
  const res = await apiFetch<{ accounts: ManualPaymentBankAccount[] }>(
    "payments/manual-instructions",
  );
  return res.accounts ?? [];
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
