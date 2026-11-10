"use client";

import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { fetchPricingCatalog } from "@/lib/api/pricing";
import {
  hotlineTelHref,
  type SupportHotlineInfo,
} from "@/lib/format/support-hotline";

type Props = {
  lang?: "id" | "en";
  className?: string;
  /** Tampilkan ikon telepon */
  showIcon?: boolean;
};

export function SupportHotline({
  lang = "id",
  className,
  showIcon = true,
}: Props) {
  const [hotline, setHotline] = useState<SupportHotlineInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPricingCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const hl = catalog.supportHotline;
        if (hl?.phone?.trim()) {
          setHotline({ phone: hl.phone.trim(), label: hl.label });
        }
      })
      .catch(() => {
        if (!cancelled) setHotline(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!hotline) return null;

  const label =
    hotline.label?.trim() ||
    (lang === "id" ? "Hotline WorkRecord" : "WorkRecord hotline");

  return (
    <a
      href={hotlineTelHref(hotline.phone)}
      className={className ?? "support-hotline-link"}
    >
      {showIcon ? <Phone size={16} aria-hidden /> : null}
      <span>
        {label}: <strong>{hotline.phone}</strong>
      </span>
    </a>
  );
}
