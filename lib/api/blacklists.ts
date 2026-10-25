import { apiFetch } from "./client";
import type { ManualTransferInfo, PaymentCheckoutResult } from "./manual-payment";

export type BlacklistCheckoutInput = {
  employeeRecordId: string;
  note: string;
  email: string;
  voucherCode?: string;
  manualBankAccountId?: string;
};

export type BlacklistCheckoutResponse =
  | {
      mode: "PENDING_APPROVAL";
      request: { id: string; status: string; action: string };
    }
  | ({
      mode: "CHECKOUT";
      requestId?: string;
    } & PaymentCheckoutResult);

export function blacklistCheckout(token: string, input: BlacklistCheckoutInput) {
  return apiFetch<BlacklistCheckoutResponse>("blacklists/checkout", {
    method: "POST",
    token,
    body: input,
  });
}

export function approveBlacklistCheckout(
  token: string,
  requestId: string,
  input: { email: string; voucherCode?: string; manualBankAccountId?: string },
) {
  return apiFetch<BlacklistCheckoutResponse>(
    `blacklists/approvals/${requestId}/checkout`,
    {
      method: "POST",
      token,
      body: input,
    },
  );
}

export function rejectBlacklistRequest(
  token: string,
  requestId: string,
  rejectionReason: string,
) {
  return apiFetch(`blacklists/approvals/${requestId}/reject`, {
    method: "POST",
    token,
    body: { rejectionReason },
  });
}

export function cancelBlacklist(token: string, blacklistId: string) {
  return apiFetch(`blacklists/${blacklistId}/cancel`, {
    method: "PATCH",
    token,
  });
}

export type CompleteBlacklistPaymentResult =
  | { kind: "redirect" }
  | { kind: "manual"; manualTransfer: ManualTransferInfo }
  | { kind: "mock_paid" };

export async function completeBlacklistPayment(
  checkout: PaymentCheckoutResult,
  token: string,
): Promise<CompleteBlacklistPaymentResult> {
  if (checkout.manualTransfer) {
    return { kind: "manual", manualTransfer: checkout.manualTransfer };
  }
  if (
    checkout.redirectUrl &&
    typeof window !== "undefined" &&
    !checkout.redirectUrl.includes("mock")
  ) {
    window.location.assign(checkout.redirectUrl);
    return { kind: "redirect" };
  }
  throw new Error(
    "Menunggu konfirmasi pembayaran. Untuk transfer manual, selesaikan transfer lalu minta admin WorkRecord mengonfirmasi di menu Transaksi.",
  );
}

export async function payAndActivateBlacklist(
  token: string,
  input: BlacklistCheckoutInput,
) {
  const checkout = await blacklistCheckout(token, input);
  if (checkout.mode === "PENDING_APPROVAL") {
    return checkout;
  }
  await completeBlacklistPayment(checkout, token);
  return checkout;
}
