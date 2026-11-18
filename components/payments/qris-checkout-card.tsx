"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  fetchQrisPaymentStatus,
  formatIdr,
  type PaymentCheckoutResult,
} from "@/lib/api/manual-payment";

function formatQrisDeadline(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const when = date.toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `Bayar sebelum ${when} WIB. Lewat waktu itu kode QR tidak bisa dipakai.`;
}

type QrisInfo = NonNullable<PaymentCheckoutResult["qris"]>;

export function QrisCheckoutCard({
  token,
  qris,
  onPaid,
}: {
  token: string;
  qris: QrisInfo;
  onPaid?: () => void;
}) {
  const [status, setStatus] = useState("PENDING");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!token || !qris.paymentId || status === "PAID") return;
    let stop = false;
    const tick = async () => {
      try {
        const res = await fetchQrisPaymentStatus(token, qris.paymentId);
        if (stop) return;
        setStatus(res.status);
        if (res.status === "PAID") onPaid?.();
      } catch {
        /* QR tetap tampil; cek berikutnya */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 5000);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [onPaid, qris.paymentId, status, token]);

  return (
    <section className="card qris-checkout-card" aria-label="Pembayaran QRIS">
      <h3>Bayar dengan QRIS</h3>
      <p>
        Scan QR ini dari aplikasi e-wallet atau mobile banking. Nominal yang harus dibayar{" "}
        <strong>{formatIdr(qris.amount)}</strong>.
        {qris.discountAmount && qris.discountAmount > 0 && qris.originalAmount ? (
          <>
            {" "}
            Voucher berlaku: dari {formatIdr(qris.originalAmount)} menjadi{" "}
            {formatIdr(qris.amount)}.
          </>
        ) : null}
      </p>
      {qris.expiredAt && formatQrisDeadline(qris.expiredAt) ? (
        <p>{formatQrisDeadline(qris.expiredAt)}</p>
      ) : null}
      {qris.qrUrl ? (
        <img
          src={qris.qrUrl}
          alt="QRIS dinamis Winpay"
          width={260}
          height={260}
          className="qris-checkout-image"
        />
      ) : (
        <p className="explore-muted">URL gambar QR tidak diterima dari Winpay.</p>
      )}
      <p className="explore-muted">
        {status === "PAID" ? (
          "Pembayaran diterima."
        ) : checking ? (
          <span>
            <Loader2 className="animate-spin" size={14} /> Mengecek status…
          </span>
        ) : (
          "Menunggu pembayaran. Uji di simulator.winpay.id, lalu biarkan halaman ini terbuka."
        )}
      </p>
      <button
        type="button"
        className="button button-outline"
        disabled={checking || status === "PAID"}
        onClick={() => {
          setChecking(true);
          fetchQrisPaymentStatus(token, qris.paymentId)
            .then((res) => {
              setStatus(res.status);
              if (res.status === "PAID") onPaid?.();
            })
            .finally(() => setChecking(false));
        }}
      >
        Cek status pembayaran
      </button>
    </section>
  );
}
