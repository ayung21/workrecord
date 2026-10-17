"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import { forgotPassword, resetPasswordWithOtp } from "@/lib/api/auth";
import { AuthBackLink } from "@/components/auth/auth-back-link";
import { AuthFormLogo } from "@/components/auth/auth-form-logo";

const copy = {
  id: {
    title: "Lupa password",
    forgotHint:
      "Masukkan ID login atau email. Kode OTP 6 digit akan dikirim ke email terdaftar.",
    login: "ID login atau email",
    sendOtp: "Kirim OTP",
    submitting: "Memproses…",
    otpSent:
      "Jika akun terdaftar, kode OTP telah dikirim ke email. Periksa juga folder spam.",
    resetTitle: "Password baru",
    resetHint: "OTP untuk",
    resetHintSuffix: "(berlaku 10 menit).",
    otpLabel: "Kode OTP (6 digit)",
    newPassword: "Password baru",
    savePassword: "Simpan password",
    resendOtp: "Kirim ulang OTP",
    backLogin: "Kembali ke login",
    resetSuccess: "Password berhasil diubah. Silakan masuk dengan password baru.",
    error: "Terjadi kesalahan. Coba lagi.",
    stepEmail: "Email",
    stepVerify: "Verifikasi",
    backHome: "Kembali ke beranda",
  },
  en: {
    title: "Forgot password",
    forgotHint:
      "Enter your login ID or email. A 6-digit OTP will be sent to your registered email.",
    login: "Login ID or email",
    sendOtp: "Send OTP",
    submitting: "Processing…",
    otpSent:
      "If an account exists, an OTP was sent. Check your inbox and spam folder.",
    resetTitle: "New password",
    resetHint: "OTP for",
    resetHintSuffix: "(valid for 10 minutes).",
    otpLabel: "OTP code (6 digits)",
    newPassword: "New password",
    savePassword: "Save password",
    resendOtp: "Resend OTP",
    backLogin: "Back to sign in",
    resetSuccess: "Password updated. Please sign in with your new password.",
    error: "Something went wrong. Please try again.",
    stepEmail: "Email",
    stepVerify: "Verify",
    backHome: "Back to home",
  },
};

type Props = {
  lang: "id" | "en";
  loginHref: string;
  initialLoginId?: string;
  initialMode?: "forgot" | "reset";
};

function AuthSteps({
  lang,
  active,
}: {
  lang: "id" | "en";
  active: "forgot" | "reset";
}) {
  const t = copy[lang];
  const steps = [
    { key: "forgot", label: t.stepEmail },
    { key: "reset", label: t.stepVerify },
  ] as const;
  const activeIndex = active === "forgot" ? 0 : 1;

  return (
    <ol className="auth-steps" aria-label={lang === "id" ? "Langkah reset" : "Reset steps"}>
      {steps.map((step, i) => {
        const done = i < activeIndex;
        const current = i === activeIndex;
        return (
          <li
            key={step.key}
            className={
              done ? "auth-step auth-step-done" : current ? "auth-step auth-step-current" : "auth-step"
            }
          >
            <span className="auth-step-dot">{done ? "✓" : i + 1}</span>
            {step.label}
          </li>
        );
      })}
    </ol>
  );
}

export function PasswordResetFlow({
  lang,
  loginHref,
  initialLoginId = "",
  initialMode = "forgot",
}: Props) {
  const t = copy[lang];
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<"forgot" | "reset">(initialMode);
  const [loginId, setLoginId] = useState(initialLoginId);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    const id = loginId.trim();
    if (!id) return;
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await forgotPassword(id);
      setInfo(t.otpSent);
      setMode("reset");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await resetPasswordWithOtp(loginId.trim(), otp.trim(), newPassword);
      setDone(true);
      setInfo(t.resetSuccess);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.error);
    } finally {
      setLoading(false);
    }
  };

  const loginIdTrim = loginId.trim();

  if (done && info) {
    return (
      <div className="auth-card auth-card-success">
        <div className="auth-success-icon" aria-hidden>
          <ShieldCheck size={32} />
        </div>
        <h1>{t.resetTitle}</h1>
        <PasswordResetSuccessActions
          lang={lang}
          loginHref={loginHref}
          message={info}
        />
      </div>
    );
  }

  return (
    <div className="auth-card">
      <AuthFormLogo />
      <AuthSteps lang={lang} active={mode} />
      <h1 className="auth-card-title">{mode === "forgot" ? t.title : t.resetTitle}</h1>
      {mode === "forgot" ? (
        <p className="auth-card-lead">{t.forgotHint}</p>
      ) : (
        <p className="auth-card-lead">
          {t.resetHint} <strong>{loginIdTrim}</strong> {t.resetHintSuffix}
        </p>
      )}

      {info && mode === "forgot" && !error && (
        <p className="auth-alert auth-alert-success" role="status">{info}</p>
      )}

      {mode === "forgot" ? (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            void sendOtp();
          }}
        >
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
          {error && (
            <p className="auth-alert auth-alert-error" role="alert">{error}</p>
          )}
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
              t.sendOtp
            )}
          </button>
          <Link href={loginHref} className="auth-secondary-link">
            {t.backLogin}
          </Link>
        </form>
      ) : (
        <form className="auth-form" onSubmit={onResetPassword}>
          <label className="auth-field">
            <span>{t.otpLabel}</span>
            <input
              className="auth-otp-input"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoComplete="one-time-code"
              required
            />
          </label>
          <label className="auth-field">
            <span>{t.newPassword}</span>
            <span className="auth-input-wrap">
              <KeyRound size={18} className="auth-input-icon" aria-hidden />
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Min. 8 karakter"
                required
              />
            </span>
          </label>
          {error && (
            <p className="auth-alert auth-alert-error" role="alert">{error}</p>
          )}
          {info && (
            <p className="auth-alert auth-alert-success" role="status">{info}</p>
          )}
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
              t.savePassword
            )}
          </button>
          <button
            type="button"
            className="auth-secondary-link"
            disabled={loading}
            onClick={() => void sendOtp()}
          >
            {t.resendOtp}
          </button>
          <Link href={loginHref} className="auth-secondary-link">
            {t.backLogin}
          </Link>
        </form>
      )}
    </div>
  );
}

export function PasswordResetSuccessActions({
  lang,
  loginHref,
  message,
}: {
  lang: "id" | "en";
  loginHref: string;
  message: string;
}) {
  const t = copy[lang];
  return (
    <div className="auth-card-block">
      <p className="auth-alert auth-alert-success">{message}</p>
      <Link href={loginHref} className="button button-blue w-full auth-submit">
        {t.backLogin}
        <ArrowUpRight size={18} />
      </Link>
    </div>
  );
}

/** @deprecated Gunakan AuthBackLink di halaman auth */
export function LoginPageBack({ lang, href }: { lang: "id" | "en"; href: string }) {
  const label = lang === "id" ? copy.id.backHome : copy.en.backHome;
  return <AuthBackLink href={href}>{label}</AuthBackLink>;
}
