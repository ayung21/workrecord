"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetFlow } from "@/components/auth/password-reset-flow";

function LupaPasswordContent() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"id" | "en">("id");
  const returnTo = searchParams.get("returnTo") || "/jelajahi";
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/jelajahi";
  const loginHref = `/login?returnTo=${encodeURIComponent(safeReturn)}`;
  const initialLogin = searchParams.get("login") ?? "";

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const backLabel = lang === "id" ? "Kembali ke beranda" : "Back to home";

  return (
    <AuthPageShell lang={lang} onLangChange={setLang}>
      <AuthBackLink href="/">{backLabel}</AuthBackLink>
      <PasswordResetFlow
        lang={lang}
        loginHref={loginHref}
        initialLoginId={initialLogin}
      />
    </AuthPageShell>
  );
}

export default function LupaPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page auth-page-fallback">
          <Loader2 className="animate-spin" size={28} />
        </div>
      }
    >
      <LupaPasswordContent />
    </Suspense>
  );
}
