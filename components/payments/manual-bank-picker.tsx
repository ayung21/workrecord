"use client";

import type { ManualPaymentBankAccount } from "@/lib/api/manual-payment";

type Props = {
  accounts: ManualPaymentBankAccount[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

export function ManualBankAccountPicker({
  accounts,
  value,
  onChange,
  disabled,
}: Props) {
  if (accounts.length <= 1) return null;

  return (
    <fieldset className="manual-bank-picker" disabled={disabled}>
      <legend className="manual-bank-picker-legend">Rekening tujuan transfer</legend>
      <ul className="manual-bank-picker-list" role="list">
        {accounts.map((a) => {
          const title = a.label?.trim() || `${a.bankName} — ${a.accountNumber}`;
          const checked = value === a.id;
          return (
            <li key={a.id}>
              <label className={`manual-bank-picker-option${checked ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="manual-bank-account"
                  value={a.id}
                  checked={checked}
                  onChange={() => onChange(a.id)}
                />
                <span className="manual-bank-picker-copy">
                  <strong>{title}</strong>
                  <span>
                    {a.bankName} · {a.accountNumber} · a.n. {a.accountHolder}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
