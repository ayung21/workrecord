/** Tampilan DD/MM/YYYY dari nilai ISO YYYY-MM-DD. */
export function isoToDdMmYyyy(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Parse teks DD/MM/YYYY (atau dengan - .) ke ISO.
 * Mengembalikan "" jika kosong, null jika format/tanggal tidak valid.
 */
export function parseDdMmYyyyToIso(text: string): string | null {
  const t = text.trim();
  if (!t) return "";
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (year < 1000 || year > 9999) return null;
  if (month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > lastDay) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return iso;
}

export function isIsoDateWithinBounds(
  iso: string,
  bounds: { min?: string; max?: string },
): boolean {
  if (!iso) return true;
  if (bounds.min && iso < bounds.min) return false;
  if (bounds.max && iso > bounds.max) return false;
  return true;
}

/** Tanggal kalender lokal (tanpa geser UTC). */
export function isoToLocalDate(iso: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function localDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
