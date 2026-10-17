/** Harus sama dengan `PAYMENT_MOCK_SECRET` di `.env` API (dev/staging saja). */
export function getPaymentMockSecret(): string | undefined {
  if (typeof window === "undefined") {
    return (
      process.env.PAYMENT_MOCK_SECRET?.trim() ||
      process.env.NEXT_PUBLIC_PAYMENT_MOCK_SECRET?.trim() ||
      undefined
    );
  }
  return process.env.NEXT_PUBLIC_PAYMENT_MOCK_SECRET?.trim() || undefined;
}

export function paymentMockSecretHeaders(): HeadersInit {
  const secret = getPaymentMockSecret();
  if (!secret) return {};
  return { "X-Payment-Mock-Secret": secret };
}
