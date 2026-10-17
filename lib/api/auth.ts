import { apiFetch } from "./client";

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    publicLoginId: string;
    email: string | null;
    accountType: string;
    companyId: string | null;
    roleCode: string;
  };
};

export type LoginInput = {
  login: string;
  password: string;
};

/** POST /auth/login — frontend utama (Owner + perusahaan). */
export function login(input: LoginInput) {
  return apiFetch<LoginResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type AuthMeResponse = {
  user: LoginResponse["user"] & { permissions: string[] };
};

/** GET /auth/me — validasi sesi & peran setelah login. */
export function fetchAuthMe(token: string) {
  return apiFetch<AuthMeResponse>("auth/me", { token });
}

export type ActivationPreview = {
  email: string;
  publicLoginId: string;
  emailVerified: boolean;
};

export function fetchActivationPreview(token: string) {
  const q = new URLSearchParams({ token });
  return apiFetch<ActivationPreview>(`auth/activate-account?${q.toString()}`);
}

export function activateAccount(token: string, password: string) {
  return apiFetch<{ ok: true }>("auth/activate-account", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export function forgotPassword(login: string) {
  return apiFetch<{ sent: true }>("auth/forgot-password", {
    method: "POST",
    body: { login },
  });
}

export function resetPasswordWithOtp(
  login: string,
  otp: string,
  newPassword: string,
) {
  return apiFetch<{ ok: true }>("auth/reset-password", {
    method: "POST",
    body: { login, otp, newPassword },
  });
}
