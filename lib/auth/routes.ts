/** Landing / marketing — boleh diakses tanpa login. */
export const PUBLIC_HOME_PATH = "/";

/** Setelah login, default redirect (jelajahi → portal cari). */
export const APP_HOME_PATH = "/jelajahi";

/** Prefix rute yang wajib sesi login valid. */
export const AUTH_REQUIRED_PREFIXES = ["/perusahaan", "/jelajahi", "/payments"];

/** Hanya untuk pengunjung belum login. */
export const GUEST_ONLY_PATHS = ["/daftar"];

export function isAuthRequiredPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
