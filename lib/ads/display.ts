/**
 * Spesifikasi penayangan iklan company profile — selaras dengan modul Iklan di admin WorkRecord.
 * @see admin-workrecord/src/AdminModules.jsx (AD_IMAGE_SPECS, AD_CAROUSEL_PLACEMENT)
 */

export const AD_CAROUSEL_PLACEMENT = "COMPANY_PROFILE_HERO";
export const AD_FOOTER_PLACEMENT = "COMPANY_PROFILE_FOOTER";

/** Rekomendasi file upload (admin): 2400×800 px, rasio 3∶1, maks. 2,5 MB */
export const HERO_BANNER_IMAGE_SPEC = {
  width: 2400,
  height: 800,
  ratio: "3∶1",
  maxMb: 2.5,
} as const;

/** Slot tampil di layar: ~200px tinggi, overlay teks di kiri ~45% */
export const HERO_BANNER_SLOT = {
  overlayWidthPercent: 45,
  displayAspectRatio: "1240 / 200",
} as const;

export type AdLike = {
  sortOrder?: number | null;
};

/** Urutan carousel: angka sortOrder lebih besar tampil lebih dulu (sama seperti daftar iklan admin). */
export function sortAdsForDisplay<T extends AdLike>(rows: T[]): T[] {
  return [...rows].sort(
    (a, b) => Number(b.sortOrder ?? 0) - Number(a.sortOrder ?? 0),
  );
}

export function mapActiveAdsWithBanner<T extends AdLike & { id: string }>(
  rows: T[],
  resolveBanner: (ad: T) => string | null,
): (T & { bannerSrc: string | null })[] {
  return sortAdsForDisplay(rows).map((row) => ({
    ...row,
    bannerSrc: resolveBanner(row),
  }));
}
