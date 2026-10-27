"use client";

import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  id?: string;
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  value,
  onChange,
  autoComplete = "current-password",
  placeholder,
  required,
  minLength,
  id,
  showLabel = "Tampilkan kata sandi",
  hideLabel = "Sembunyikan kata sandi",
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="auth-input-wrap auth-input-wrap--password">
      <KeyRound size={18} className="auth-input-icon" aria-hidden />
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
      <button
        type="button"
        className="auth-password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? hideLabel : showLabel}
        aria-pressed={visible}
      >
        {visible ? (
          <EyeOff size={18} aria-hidden />
        ) : (
          <Eye size={18} aria-hidden />
        )}
      </button>
    </span>
  );
}
