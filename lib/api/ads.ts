import { apiFetch, apiUrl } from "./client";

/** Bentuk iklan dari API (`serializeAd` + kolom `ad_placements`). */
export type AdPlacement = {
  id: string;
  companyId?: string | null;
  adPackageId?: string | null;
  placement?: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  status: string;
  priceAmount?: string | null;
  paymentId?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  /** Path relatif ke GET `/ads/:id/banner` jika file banner ada di server. */
  bannerImageUrl?: string | null;
};

export function resolveAdBannerUrl(ad: {
  id: string;
  bannerImageUrl?: string | null;
}) {
  if (!ad.bannerImageUrl) return null;
  if (ad.bannerImageUrl.startsWith("http")) return ad.bannerImageUrl;
  return apiUrl(ad.bannerImageUrl.replace(/^\//, ""));
}

export function fetchActiveAds(placement?: string) {
  const q = placement
    ? `?placement=${encodeURIComponent(placement)}`
    : "";
  return apiFetch<AdPlacement[]>(`ads/active${q}`);
}

export function checkoutCompanyAd(
  token: string,
  body: {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    adPackageId?: string;
    priceAmount?: number;
  },
) {
  return apiFetch<{ adId: string; paymentId: string; amount: number }>(
    "ads/checkout",
    {
      method: "POST",
      token,
      body: JSON.stringify(body),
    },
  );
}
