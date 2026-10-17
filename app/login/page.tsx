"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowUpRight, Loader2, Mail, KeyRound } from "lucide-react";
import { AuthFormLogo } from "@/components/auth/auth-form-logo";
import { ApiRequestError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { readSession, writeSession } from "@/lib/auth/session";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { PasswordResetFlow } from "@/components/auth/password-reset-flow";

const copy = {
  id: {
    title: "Masuk",
    subtitle:
      "Gunakan akun Admin, Kepemimpinan PT, atau Owner platform. Akun perusahaan tidak dapat masuk ke panel admin terpisah.",
    login: "ID login atau email",
    password: "Kata sandi",
    submit: "Masuk",
    submitting: "Memproses…",
    back: "Kembali ke beranda",
    hint: "Contoh dev: ADM-DUMMYMAJU / DummyPass123!",
    error: "Login gagal. Periksa kredensial Anda.",
    already: "Anda sudah masuk.",
    continue: "Lanjutkan",
    forgotLink: "Lupa password?",
    noAccount: "Belum punya akun?",
    register: "Daftarkan perusahaan",
  },
  en: {
    title: "Sign in",
    subtitle:
      "Use your Admin, company Leadership, or platform Owner account. Company accounts cannot sign in to the separate admin panel.",
    login: "Login ID or email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in…",
    back: "Back to home",
    hint: "Dev example: ADM-DUMMYMAJU / DummyPass123!",
    error: "Sign-in failed. Check your credentials.",
    already: "You are already signed in.",
    continue: "Continue",
    forgotLink: "Forgot password?",
    noAccount: "No account yet?",
    register: "Register your company",
  },
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<"id" | "en">("id");
  const t = copy[lang];

  const returnTo = searchParams.get("returnTo") || "/jelajahi";
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : "/jelajahi";
  const showReset =
    searchParams.get("forgot") === "1" ||
    searchParams.get("mode") === "forgot";

  const forgotHref = `/lupa-password?returnTo=${encodeURIComponent(safeReturn)}`;

  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    document.documentElement.lang = lang;
    setExisting(Boolean(readSession()));
  }, [lang]);

  const onSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const session = await login({
        login: loginId.trim(),
        password,
      });
      writeSession(session);
      router.push(safeReturn);
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : t.error,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell lang={lang} onLangChange={setLang}>
      <AuthBackLink href="/">{t.back}</AuthBackLink>

      {showReset ? (
        <PasswordResetFlow
          lang={lang}
          loginHref={`/login?returnTo=${encodeURIComponent(safeReturn)}`}
          initialLoginId={searchParams.get("login") ?? ""}
        />
      ) : (
        <div className="auth-card">
          <AuthFormLogo />
          <h1 className="auth-card-title">{t.title}</h1>
          <p className="auth-card-lead">{t.subtitle}</p>

          {existing ? (
            <div className="auth-card-block">
              <p>{t.already}</p>
              <Link href={safeReturn} className="button button-blue w-full auth-submit">
                {t.continue}
                <ArrowUpRight size={18} />
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={onSubmitLogin}>
              <label className="auth-field">
                <span>{t.login}</span>
                <span className="auth-input-wrap">
                  <Mail size={18} className="auth-input-icon" aria-hidden />
                  <input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    autoComplete="username"
                    placeholder="contoh@perusahaan.id"
                    required
                  />
                </span>
              </label>
              <label className="auth-field">
                <span className="auth-label-row">
                  <span>{t.password}</span>
                  <Link href={forgotHref} className="auth-inline-link">
                    {t.forgotLink}
                  </Link>
                </span>
                <span className="auth-input-wrap">
                  <KeyRound size={18} className="auth-input-icon" aria-hidden />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </span>
              </label>
              {error && (
                <p className="auth-alert auth-alert-error" role="alert">
                  {error}
                </p>
              )}
              <p className="auth-hint">{t.hint}</p>
              <button
                type="submit"
                className="button button-blue w-full auth-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    {t.submitting}
                  </>
                ) : (
                  <>
                    {t.submit}
                    <ArrowUpRight size={18} />
                  </>
                )}
              </button>
              <p className="auth-footer-note">
                {t.noAccount}{" "}
                <Link href="/daftar" className="auth-inline-link">
                  {t.register}
                </Link>
              </p>
            </form>
          )}
        </div>
      )}
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="auth-page auth-page-fallback">
          <Loader2 className="animate-spin" size={28} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
