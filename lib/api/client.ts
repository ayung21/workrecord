const DEFAULT_API_ORIGIN = "http://localhost:3007";
const DEFAULT_BROWSER_BASE = "/api";

/** Base URL untuk `fetch`: di browser lewat proxy `/api`, di server langsung ke API. */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    const serverUrl =
      process.env.API_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      DEFAULT_API_ORIGIN;
    return serverUrl.replace(/\/$/, "");
  }
  const browserBase =
    process.env.NEXT_PUBLIC_API_BASE ?? DEFAULT_BROWSER_BASE;
  return browserBase.replace(/\/$/, "") || DEFAULT_BROWSER_BASE;
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.replace(/^\//, "");
  return `${base}/${normalized}`;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }
}

function serializeJsonBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  ) {
    return body as BodyInit;
  }
  return JSON.stringify(body);
}

export function formatApiErrorMessage(err: unknown): string {
  if (err instanceof ApiRequestError) {
    if (err.status === 413) {
      return err.message;
    }
    const raw = (err.body as { message?: string | string[] } | null)?.message;
    if (Array.isArray(raw)) {
      return raw.filter(Boolean).join("\n");
    }
    if (typeof raw === "string" && raw.trim()) return raw;
    return err.message;
  }
  if (err instanceof Error) {
    const msg = err.message;
    if (
      msg.trim().startsWith("<") &&
      /413|entity too large/i.test(msg)
    ) {
      return "Berkas terlalu besar. Ukuran maksimal 5 MB per dokumen.";
    }
    if (msg.trim().startsWith("<")) {
      return "Permintaan gagal diproses oleh server. Coba lagi atau hubungi dukungan.";
    }
    return msg;
  }
  return "Terjadi kesalahan.";
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { token?: string; body?: unknown },
): Promise<T> {
  const { token, headers: initHeaders, body, ...rest } = init ?? {};
  const headers = new Headers(initHeaders);

  const payload = serializeJsonBody(body);
  if (
    payload !== undefined &&
    typeof payload === "string" &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers,
    body: payload,
    credentials: "include",
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = res.statusText;
    if (typeof data === "object" && data !== null && "message" in data) {
      const raw = (data as { message: unknown }).message;
      message = Array.isArray(raw) ? raw.join(", ") : String(raw);
    }
    throw new ApiRequestError(message, res.status, data);
  }

  return data as T;
}
