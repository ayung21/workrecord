/** URL publik situs (tanpa trailing slash). Wajib di production via NEXT_PUBLIC_SITE_URL. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3008";
}

/** Origin untuk server atau browser (sertifikat, canonical, dll.). */
export function getSiteOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return getSiteUrl();
}
