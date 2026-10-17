import type { LoginResponse } from "@/lib/api/auth";

type User = LoginResponse["user"];

/** Subjudul di header: peran akun yang sedang login. */
export function loginRoleSubtitle(
  user: User,
  lang: "id" | "en",
): string | null {
  if (user.roleCode === "OWNER") {
    return lang === "id" ? "Login sebagai Owner" : "Signed in as Owner";
  }
  if (user.accountType === "ADMIN") {
    return lang === "id" ? "Login sebagai Admin" : "Signed in as Admin";
  }
  if (user.accountType === "LEADERSHIP") {
    return lang === "id" ? "Login sebagai Atasan" : "Signed in as Leadership";
  }
  return null;
}
