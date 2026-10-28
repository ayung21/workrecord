import { ApiRequestError } from "./client";

export function throwFormUploadError(
  res: Response,
  text: string,
  data: unknown,
  opts: { tooLargeMessage: string; htmlFallbackLabel: string },
): never {
  if (
    res.status === 413 ||
    /request entity too large/i.test(text) ||
    /entity too large/i.test(res.statusText)
  ) {
    throw new ApiRequestError(opts.tooLargeMessage, res.status, data);
  }

  if (text.trim().startsWith("<")) {
    throw new ApiRequestError(
      `Gagal mengunggah ${opts.htmlFallbackLabel} (HTTP ${res.status}).`,
      res.status,
      data,
    );
  }

  let message = res.statusText;
  if (typeof data === "object" && data !== null && "message" in data) {
    const raw = (data as { message: unknown }).message;
    message = Array.isArray(raw) ? raw.join(", ") : String(raw);
  } else if (text.trim()) {
    message = text;
  }
  throw new ApiRequestError(message, res.status, data);
}
