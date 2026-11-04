import { getSiteOrigin } from "@/lib/seo/site-url";

export { getSiteOrigin };

export function memberVerifyPageUrl(verifyToken: string): string {
  return `${getSiteOrigin()}/verifikasi-member/${encodeURIComponent(verifyToken)}`;
}

export function memberCertificatePageUrl(verifyToken: string): string {
  return `${memberVerifyPageUrl(verifyToken)}/sertifikat`;
}
