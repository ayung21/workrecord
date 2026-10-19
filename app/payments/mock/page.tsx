"use client";

import Link from "@/components/app-link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import { mockCompletePayment } from "@/lib/api/companies";

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

function MockPayment() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") ?? "";
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  const pay = async () => {
    if (!paymentId) {
      setStatus("error");
      setMessage("ID pembayaran tidak ditemukan.");
      return;
    }
    setStatus("loading");
    setMessage(null);
    try {
      await mockCompletePayment(paymentId);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiRequestError ? err.message : "Pembayaran gagal.",
      );
    }
  };

  useEffect(() => {
    if (!paymentId) {
      setStatus("error");
      setMessage("ID pembayaran tidak ditemukan.");
    }
  }, [paymentId]);

  return (
    <div className="site-shell login-page">
      <header className="site-header">
        <div className="container header-inner">
          <Brand />
        </div>
      </header>
      <main className="login-main">
        <div className="container login-layout">
          <div className="login-card">
            <div className="login-card-icon">
              <CreditCard size={28} />
            </div>
            <h1>Pembayaran langganan (simulasi)</h1>
            {status === "idle" && paymentId && (
              <button
                type="button"
                className="button button-blue w-full login-submit"
                onClick={() => void pay()}
              >
                Bayar (simulasi)
                <ArrowUpRight size={18} />
              </button>
            )}
            {status === "loading" && (
              <p>
                <Loader2 className="animate-spin inline" size={18} />
                Memproses pembayaran…
              </p>
            )}
            {status === "done" && (
              <>
                <p>Pembayaran berhasil. Langganan menunggu verifikasi survey.</p>
                <Link href="/login" className="button button-blue w-full">
                  Masuk ke WorkRecord
                  <ArrowUpRight size={18} />
                </Link>
              </>
            )}
            {status === "error" && (
              <>
                <p className="explore-error" role="alert">{message}</p>
                <button
                  type="button"
                  className="button button-outline w-full"
                  onClick={() => {
                    setStatus("idle");
                    void pay();
                  }}
                >
                  Coba lagi
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="login-main">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <MockPayment />
    </Suspense>
  );
}
