import { RequireGuest } from "@/components/auth/require-guest";

export default function DaftarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireGuest>{children}</RequireGuest>;
}
