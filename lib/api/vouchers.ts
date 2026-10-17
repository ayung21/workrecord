import { apiFetch } from "./client";

export type VoucherQuote = {
  voucherId: string;
  code: string;
  originalAmount: number;
  finalAmount: number;
  discountAmount: number;
};

export type CompanyVoucherOption = {
  code: string;
  title: string;
  benefitType: string;
  benefitValue: number;
};

export function listAvailableVouchers(
  token: string,
  appliesTo: "BLACKLIST" | "DISPUTE" | "VIEW_ACCESS",
) {
  const q = new URLSearchParams({ appliesTo });
  return apiFetch<CompanyVoucherOption[]>(`vouchers/available?${q}`, { token });
}

export function quoteVoucher(input: {
  code: string;
  appliesTo: "BLACKLIST" | "DISPUTE" | "VIEW_ACCESS";
  amount: number;
  companyId?: string;
}) {
  return apiFetch<VoucherQuote>("vouchers/quote", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
