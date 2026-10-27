import { apiFetch } from "./client";
import type { PaymentCheckoutResult } from "./manual-payment";
import { getPaymentMockSecret, paymentMockSecretHeaders } from "./payment-mock";
import { COMPANY_TERMS_VERSION } from "@/lib/constants/company-terms";

export type PartnerRelationRole = "ATASAN" | "BAWAHAN";

export type RegisterCompanyInput = {
  companyName: string;
  companyPhone: string;
  fullName: string;
  email: string;
  password: string;
  personalPhone: string;
  partnerAccount: {
    fullName: string;
    email: string;
    personalPhone: string;
    relationRole: PartnerRelationRole;
  };
  terms: {
    companyInfoTrue: boolean;
    authorizedRepresentative: boolean;
    masterResponsibility: boolean;
    termsAndPrivacy: boolean;
  };
  termsVersion?: string;
};

export type RegisterCompanyResponse = {
  companyId: string;
  adminPublicId: string;
  leaderPublicId: string;
  primaryPublicId: string;
  partnerPublicId: string;
  primaryRole: string;
  partnerRole: string;
  message: string;
};

export function registerCompany(input: RegisterCompanyInput) {
  return apiFetch<RegisterCompanyResponse>("companies/register", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      termsVersion: input.termsVersion ?? COMPANY_TERMS_VERSION,
    }),
  });
}

export function createDisputeCheckout(
  token: string,
  input: {
    email: string;
    employeeRecordId?: string;
    voucherCode?: string;
    manualBankAccountId?: string;
  },
) {
  return apiFetch<PaymentCheckoutResult>(
    "disputes/checkout",
    {
      method: "POST",
      token,
      body: JSON.stringify(input),
    },
  );
}

export function mockCompletePayment(paymentId: string, token?: string) {
  if (!getPaymentMockSecret()) {
    throw new Error(
      "Mock pembayaran: set NEXT_PUBLIC_PAYMENT_MOCK_SECRET di .env.local (nilai sama dengan PAYMENT_MOCK_SECRET di API), lalu restart dev server.",
    );
  }
  return apiFetch<{ id: string; status: string }>(
    `payments/${paymentId}/mock-complete`,
    {
      method: "POST",
      token,
      headers: paymentMockSecretHeaders(),
    },
  );
}
