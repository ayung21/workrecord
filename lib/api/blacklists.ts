import { apiFetch } from "./client";
import { mockCompletePayment } from "./companies";

export type BlacklistCheckoutInput = {
  employeeRecordId: string;
  note: string;
  email: string;
  voucherCode?: string;
};

export type BlacklistCheckoutResponse =
  | {
      mode: "PENDING_APPROVAL";
      request: { id: string; status: string; action: string };
    }
  | {
      mode: "CHECKOUT";
      paymentId: string;
      amount: number;
      redirectUrl?: string;
      requestId?: string;
    };

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
  input: { email: string; voucherCode?: string },
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

export async function completeBlacklistPayment(
  checkout: { paymentId: string; redirectUrl?: string },
  token: string,
) {
  if (
    checkout.redirectUrl &&
    typeof window !== "undefined" &&
    !checkout.redirectUrl.includes("mock")
  ) {
    window.location.assign(checkout.redirectUrl);
    return;
  }
  await mockCompletePayment(checkout.paymentId, token);
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
