"use client";

import { ArrowUpRight } from "lucide-react";
import type { AdPlacement } from "@/lib/api/ads";

const BANNER_GRADIENTS = [
  "linear-gradient(120deg, #142442 0%, #2459df 55%, #3b7cff 100%)",
  "linear-gradient(120deg, #1a3568 0%, #0f766e 50%, #14b8a6 100%)",
  "linear-gradient(120deg, #312e81 0%, #2459df 45%, #d8f68a 120%)",
];

export type HeroBannerAd = AdPlacement & {
  /** URL siap pakai untuk `<img>` (dari `resolveAdBannerUrl`). */
  bannerSrc?: string | null;
};

type Props = {
  ad: HeroBannerAd;
  index: number;
  /** Slot kosong (belum ada iklan aktif). */
  placeholder?: boolean;
  lang?: "id" | "en";
};

/**
 * Satu slide carousel hero — konten dari API: title, subtitle, ctaLabel, ctaUrl, banner.
 * Tanpa gambar: gradien (sesuai petunjuk admin). Dengan gambar: crop cover + overlay kiri.
 */
export function CompanyProfileHeroBannerSlide({
  ad,
  index,
  placeholder = false,
  lang = "id",
}: Props) {
  const gradient = BANNER_GRADIENTS[index % BANNER_GRADIENTS.length];
  const bannerSrc = ad.bannerSrc?.trim() || null;
  const hasBanner = Boolean(bannerSrc && !placeholder);
  const ctaLabel =
    ad.ctaLabel?.trim() ||
    (lang === "id" ? "Pelajari" : "Learn more");

  const inner = (
    <div
      className={
        placeholder
          ? "home-ad-banner-slide home-ad-banner-slide-placeholder"
          : hasBanner
            ? "home-ad-banner-slide home-ad-banner-slide-has-image"
            : "home-ad-banner-slide home-ad-banner-slide-text-only"
      }
      style={hasBanner ? undefined : { background: gradient }}
    >
      {hasBanner ? (
        // eslint-disable-next-line @next/next/no-img-element -- banner publik GET /ads/:id/banner
        <img
          src={bannerSrc!}
          alt=""
          className="home-ad-banner-image"
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
        />
      ) : null}
      <div className="home-ad-banner-scrim" aria-hidden />
      <div className="home-ad-banner-copy">
        <span className="home-ad-banner-tag">
          {placeholder
            ? lang === "id"
              ? "Slot iklan"
              : "Ad slot"
            : lang === "id"
              ? "Iklan"
              : "Ad"}
        </span>
        <h3>{ad.title}</h3>
        {ad.subtitle ? <p>{ad.subtitle}</p> : null}
        {ad.ctaUrl ? (
          <span className="home-ad-banner-cta">
            {ctaLabel}
            <ArrowUpRight size={18} aria-hidden />
          </span>
        ) : null}
      </div>
    </div>
  );

  if (ad.ctaUrl && !placeholder) {
    return (
      <a
        href={ad.ctaUrl}
        className="home-ad-banner-link"
        target="_blank"
        rel="noreferrer"
      >
        {inner}
      </a>
    );
  }

  return inner;
}
