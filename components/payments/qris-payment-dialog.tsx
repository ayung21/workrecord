"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrisCheckoutCard } from "@/components/payments/qris-checkout-card";
import type { PaymentCheckoutResult } from "@/lib/api/manual-payment";

type QrisInfo = NonNullable<PaymentCheckoutResult["qris"]>;

export function QrisPaymentDialog({
  token,
  qris,
  open,
  onOpenChange,
  onPaid,
}: {
  token: string;
  qris: QrisInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: () => void;
}) {
  if (!open) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bayar QRIS</DialogTitle>
          <DialogDescription>
            Scan kode dinamis ini. Status berubah otomatis setelah pembayaran masuk.
          </DialogDescription>
        </DialogHeader>
        {qris ? (
          <QrisCheckoutCard token={token} qris={qris} onPaid={onPaid} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
