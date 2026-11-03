export { getSiteOrigin } from "@/lib/seo/site-url";

export function memberVerifyPageUrl(verifyToken: string): string {
  return `${getSiteOrigin()}/verifikasi-member/${encodeURIComponent(verifyToken)}`;
}

export function memberCertificatePageUrl(verifyToken: string): string {
  return `${memberVerifyPageUrl(verifyToken)}/sertifikat`;
}
