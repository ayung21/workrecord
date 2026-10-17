import { RequireAuth } from "@/components/auth/require-auth";

export default function JelajahiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
