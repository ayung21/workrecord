"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  fetchActiveAds,
  resolveAdBannerUrl,
  type AdPlacement,
} from "@/lib/api/ads";
import {
  AD_FOOTER_PLACEMENT,
  mapActiveAdsWithBanner,
} from "@/lib/ads/display";

type FooterAd = AdPlacement & { bannerSrc: string | null };

type Props = {
  lang?: "id" | "en";
};

function FooterAdCard({
  ad,
  lang,
}: {
  ad: FooterAd;
  lang: "id" | "en";
}) {
  const ctaLabel =
    ad.ctaLabel?.trim() ||
    (lang === "id" ? "Pelajari" : "Learn more");

  const inner = (
    <article className="home-ad-footer-card">
      {ad.bannerSrc ? (
        <div className="home-ad-footer-banner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ad.bannerSrc} alt="" loading="lazy" decoding="async" />
        </div>
      ) : null}
      <span className="home-ad-footer-tag">
        {lang === "id" ? "Iklan" : "Ad"}
      </span>
      <h3>{ad.title}</h3>
      {ad.subtitle && <p>{ad.subtitle}</p>}
      {ad.ctaUrl && (
        <span className="home-ad-footer-cta">
          {ctaLabel}
          <ArrowUpRight size={16} />
        </span>
      )}
    </article>
  );

  if (ad.ctaUrl) {
    return (
      <a
        href={ad.ctaUrl}
        className="home-ad-footer-link"
        target="_blank"
        rel="noreferrer"
      >
        {inner}
      </a>
    );
  }

  return inner;
}

/** Strip promosi bawah company profile — placement `COMPANY_PROFILE_FOOTER`. */
export function HomeProfileFooterAds({ lang = "id" }: Props) {
  const [ads, setAds] = useState<FooterAd[]>([]);

  useEffect(() => {
    fetchActiveAds(AD_FOOTER_PLACEMENT)
      .then((rows) =>
        setAds(mapActiveAdsWithBanner(rows, (row) => resolveAdBannerUrl(row))),
      )
      .catch(() => setAds([]));
  }, []);

  if (!ads.length) return null;

  return (
    <section
      className="home-ad-footer-section"
      aria-label={lang === "id" ? "Promosi partner" : "Partner promotions"}
    >
      <div className="container">
        <p className="home-ad-footer-eyebrow">
          {lang === "id" ? "PROMOSI & PARTNER" : "PROMOTIONS & PARTNERS"}
        </p>
        <div className="home-ad-footer-grid">
          {ads.map((ad) => (
            <FooterAdCard key={ad.id} ad={ad} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
