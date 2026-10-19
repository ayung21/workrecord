"use client";

import Link from "@/components/app-link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CompanyProfileHeroBannerSlide,
  type HeroBannerAd,
} from "@/components/ads/company-profile-hero-banner-slide";
import {
  fetchActiveAds,
  resolveAdBannerUrl,
} from "@/lib/api/ads";
import { AD_CAROUSEL_PLACEMENT, mapActiveAdsWithBanner } from "@/lib/ads/display";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const placeholderCopy = {
  id: {
    title: "Banner iklan WorkRecord",
    subtitle:
      "Slot carousel atas company profile. Owner mengunggah banner (3∶1) lewat admin; perusahaan memesan judul, subjudul, dan CTA lewat portal.",
    cta: "Info untuk perusahaan",
  },
  en: {
    title: "WorkRecord ad banner",
    subtitle:
      "Top carousel on the company profile. Owners upload banners in admin; companies set title, subtitle, and CTA in the portal.",
    cta: "Info for companies",
  },
};

type Props = {
  lang?: "id" | "en";
};

/** Carousel banner atas company profile (`/`) — placement `COMPANY_PROFILE_HERO`. */
export function HomeActiveAds({ lang = "id" }: Props) {
  const [ads, setAds] = useState<HeroBannerAd[] | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [active, setActive] = useState(0);

  const ph = placeholderCopy[lang];

  const placeholderSlides = useMemo<HeroBannerAd[]>(
    () => [
      {
        id: "banner-placeholder",
        title: ph.title,
        subtitle: ph.subtitle,
        ctaLabel: ph.cta,
        ctaUrl: "/daftar",
        status: "PLACEHOLDER",
        sortOrder: 0,
      },
    ],
    [ph],
  );

  const isLoading = ads === null;
  const slides = !isLoading && ads.length > 0 ? ads : placeholderSlides;
  const isPlaceholder = !isLoading && ads.length === 0;

  useEffect(() => {
    fetchActiveAds(AD_CAROUSEL_PLACEMENT)
      .then((rows) =>
        setAds(
          mapActiveAdsWithBanner(rows, (row) => resolveAdBannerUrl(row)),
        ),
      )
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[HomeActiveAds] Gagal memuat ads/active:", err);
        }
        setAds([]);
      });
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setActive(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || slides.length < 2 || isPlaceholder) return;
    const timer = window.setInterval(() => {
      if (api.canScrollNext()) api.scrollNext();
      else api.scrollTo(0);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [api, slides.length, isPlaceholder]);

  const scrollTo = useCallback(
    (index: number) => api?.scrollTo(index),
    [api],
  );

  if (isLoading) {
    return (
      <section
        className="home-ad-banner-section home-ad-banner-section-loading"
        aria-label={lang === "id" ? "Banner iklan" : "Ad banner"}
        aria-busy="true"
      >
        <div className="container">
          <div className="home-ad-banner-slide home-ad-banner-skeleton" />
        </div>
      </section>
    );
  }

  return (
    <section
      className={`home-ad-banner-section${isPlaceholder ? " home-ad-banner-section-placeholder" : ""}`}
      aria-label={lang === "id" ? "Banner iklan" : "Ad banner"}
    >
      <div className="container">
        <Carousel
          setApi={setApi}
          opts={{ align: "start", loop: slides.length > 1 }}
          className="home-ad-banner-carousel"
        >
          <CarouselContent className="home-ad-banner-content">
            {slides.map((ad, i) => (
              <CarouselItem key={ad.id} className="home-ad-banner-item">
                <CompanyProfileHeroBannerSlide
                  ad={ad}
                  index={i}
                  placeholder={isPlaceholder}
                  lang={lang}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {!isPlaceholder && slides.length > 1 && (
            <>
              <CarouselPrevious className="home-ad-banner-nav home-ad-banner-nav-prev" />
              <CarouselNext className="home-ad-banner-nav home-ad-banner-nav-next" />
              <div className="home-ad-banner-dots" role="tablist">
                {slides.map((ad, i) => (
                  <button
                    key={ad.id}
                    type="button"
                    role="tab"
                    aria-selected={active === i}
                    aria-label={`Slide ${i + 1}`}
                    className={
                      active === i
                        ? "home-ad-banner-dot is-active"
                        : "home-ad-banner-dot"
                    }
                    onClick={() => scrollTo(i)}
                  />
                ))}
              </div>
            </>
          )}
        </Carousel>
        {isPlaceholder && (
          <p className="home-ad-banner-footnote">
            {lang === "id" ? (
              <>
                Perusahaan terdaftar dapat memesan iklan lewat{" "}
                <Link href="/login">Masuk</Link> → portal <strong>Iklan</strong>.
                Banner visual diunggah Owner di panel admin.
              </>
            ) : (
              <>
                Registered companies can book ads after{" "}
                <Link href="/login">sign-in</Link> → portal <strong>Ads</strong>.
                Banner artwork is uploaded by the Owner in admin.
              </>
            )}
          </p>
        )}
      </div>
    </section>
  );
}
