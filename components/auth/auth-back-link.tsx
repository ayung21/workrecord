import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function AuthBackLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="auth-back">
      <ArrowLeft size={16} aria-hidden />
      {children}
    </Link>
  );
}
