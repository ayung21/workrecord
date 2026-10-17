import { RequireAuth } from "@/components/auth/require-auth";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
