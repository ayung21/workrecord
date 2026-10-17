/** Platform Owner — boleh login frontend utama dan panel admin. */
export const PLATFORM_OWNER_ROLE = "OWNER";

/** Akun perusahaan — hanya frontend utama, tidak panel admin. */
export const COMPANY_PORTAL_ROLES = [
  "COMPANY_ADMIN",
  "COMPANY_LEADERSHIP",
] as const;

export function isPlatformOwner(roleCode: string | undefined | null): boolean {
  return roleCode === PLATFORM_OWNER_ROLE;
}

export function isCompanyPortalRole(
  roleCode: string | undefined | null,
): boolean {
  if (!roleCode) return false;
  return (COMPANY_PORTAL_ROLES as readonly string[]).includes(roleCode);
}

/** Area portal perusahaan (/perusahaan/*) — bukan untuk Owner platform. */
export function canAccessCompanyPortal(roleCode: string | undefined | null): boolean {
  return isCompanyPortalRole(roleCode);
}
