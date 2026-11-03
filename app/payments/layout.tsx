import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "Pembayaran",
  robots: { index: false, follow: true },
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
