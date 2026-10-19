"use client";

import Link from "@/components/app-link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import {
  activateAccount,
  fetchActivationPreview,
} from "@/lib/api/auth";
import { HeaderAuthLink } from "@/components/header-auth-link";

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="WorkRecord">
      <span className="brand-mark">
        <CheckCheck strokeWidth={3} size={25} />
      </span>
      <span>
        work<span className="font-normal">record</span>
        <span className="brand-dot">.</span>
      </span>
    </Link>
  );
}

function ActivateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [lang, setLang] = useState<"id" | "en">("id");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [publicLoginId, setPublicLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (!token) {
      setPreviewError("Token aktivasi tidak ditemukan.");
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchActivationPreview(token);
        if (!cancelled) {
          setEmail(data.email);
          setPublicLoginId(data.publicLoginId);
        }
      } catch (err) {
        if (!cancelled) {
          setPreviewError(
            err instanceof ApiRequestError
              ? err.message
              : "Token tidak valid.",
          );
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError("Kata sandi tidak sama.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await activateAccount(token, password);
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Aktivasi gagal.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="site-shell login-page">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
          <div className="header-actions">
            <HeaderAuthLink lang={lang} />
          </div>
        </div>
      </header>

      <main className="login-main">
        <div className="container login-layout">
          <Link href="/" className="explore-back">
            <ArrowLeft size={16} />
            Beranda
          </Link>

          <div className="login-card">
            <div className="login-card-icon">
              <ShieldCheck size={28} />
            </div>
            <h1>Aktivasi akun WorkRecord</h1>
            <p>
              Verifikasi email dan buat kata sandi baru untuk mulai login.
            </p>

            {previewLoading ? (
              <Loader2 className="animate-spin" size={28} />
            ) : previewError ? (
              <p className="explore-error" role="alert">{previewError}</p>
            ) : (
              <form className="login-form" onSubmit={onSubmit}>
                <p className="login-hint">
                  ID Login: <strong>{publicLoginId}</strong>
                  <br />
                  Email: <strong>{email}</strong>
                </p>
                <label>
                  <span>Kata sandi baru</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span>Ulangi kata sandi</span>
                  <input
                    type="password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>
                {error && (
                  <p className="explore-error" role="alert">{error}</p>
                )}
                <button
                  type="submit"
                  className="button button-blue w-full login-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Memproses…
                    </>
                  ) : (
                    <>
                      Aktifkan akun
                      <ArrowUpRight size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AktivasiAkunPage() {
  return (
    <Suspense
      fallback={
        <div className="login-main">
          <div className="container login-layout">
            <Loader2 className="animate-spin" />
          </div>
        </div>
      }
    >
      <ActivateForm />
    </Suspense>
  );
}
