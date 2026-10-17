import { apiFetch } from "./client";

export type PricingCatalog = {
  currency: string;
  fees: {
    sanggahanKaryawanIdr: number;
    /** Alias kompatibilitas */
    blacklistIdr?: number;
    disputeIdr?: number;
    sanggahanIdr?: number;
  };
  adPackages: {
    id: string;
    code: string;
    label: string;
    placement: string;
    placementLabel: string;
    durationDays: number;
    priceIdr: number;
    description: string | null;
    validFrom: string | null;
    validUntil: string | null;
  }[];
};

export function fetchPricingCatalog() {
  return apiFetch<PricingCatalog>("pricing/catalog");
}
