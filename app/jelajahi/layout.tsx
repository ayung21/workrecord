import type { Metadata } from "next";
import { RequireAuth } from "@/components/auth/require-auth";

export const metadata: Metadata = {
  title: "Jelajahi Record",
  robots: { index: false, follow: true },
};

export default function JelajahiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
