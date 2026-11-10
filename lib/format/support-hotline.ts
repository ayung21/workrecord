export type SupportHotlineInfo = {
  phone: string;
  label?: string;
};

/** Digit untuk atribut href tel: / wa.me */
export function hotlineDialDigits(phone: string): string {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    digits = `62${digits.slice(1)}`;
  }
  return digits;
}

export function hotlineTelHref(phone: string): string {
  const digits = hotlineDialDigits(phone);
  return digits ? `tel:+${digits.replace(/^\+/, "")}` : `tel:${phone.trim()}`;
}

export function hotlineWhatsAppHref(phone: string): string {
  const digits = hotlineDialDigits(phone);
  return digits ? `https://wa.me/${digits}` : "#";
}
