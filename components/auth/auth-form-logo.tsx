import Image from "next/image";
import Link from "next/link";

/** Logo brand di atas kartu login / lupa password */
export function AuthFormLogo() {
  return (
    <Link href="/" className="auth-form-logo" aria-label="WorkRecord — beranda">
      <Image
        src="/brand/logo.png"
        alt="WorkRecord"
        width={220}
        height={88}
        className="auth-form-logo-img"
        priority
      />
    </Link>
  );
}
