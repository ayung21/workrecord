export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return fromEnv ?? "http://localhost:3008";
}

export function memberVerifyPageUrl(verifyToken: string): string {
  return `${getSiteOrigin()}/verifikasi-member/${encodeURIComponent(verifyToken)}`;
}

export function memberCertificatePageUrl(verifyToken: string): string {
  return `${memberVerifyPageUrl(verifyToken)}/sertifikat`;
}
