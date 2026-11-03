import type { Metadata } from "next";
import { CompanyPortalGuard } from "@/components/company-portal-guard";

export const metadata: Metadata = {
  title: "Portal Perusahaan",
  robots: { index: false, follow: true },
};
import {
  CompanyOperationalGuard,
  CompanyPortalStatusProvider,
} from "@/components/company/company-portal-status";

export default function PerusahaanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyPortalGuard>
      <CompanyPortalStatusProvider>
        <CompanyOperationalGuard>{children}</CompanyOperationalGuard>
      </CompanyPortalStatusProvider>
    </CompanyPortalGuard>
  );
}
