import { CompanyPortalGuard } from "@/components/company-portal-guard";
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
