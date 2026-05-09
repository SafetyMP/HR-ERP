import { fallbackFriendlyMessage, friendlyMessageForCode } from "./user-friendly-errors";

export type NormalizedApiError = {
  code: string;
  status: number;
  retryable: boolean;
  title: string;
  description: string;
  requestId?: string;
  rawBody?: string;
};

export class AppHttpError extends Error {
  readonly normalized: NormalizedApiError;

  constructor(normalized: NormalizedApiError) {
    super(normalized.title);
    this.name = "AppHttpError";
    this.normalized = normalized;
  }
}

function publicBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return base.replace(/\/$/, "");
}

function parseJsonBody(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function readErrorCode(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const code = o.code ?? o.error ?? o.errorCode;
  return typeof code === "string" ? code : undefined;
}

function readDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const o = body as Record<string, unknown>;
  const detail = o.detail ?? o.message ?? o.description;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      const msg = (first as { msg?: unknown }).msg;
      if (typeof msg === "string") return msg;
    }
  }
  return undefined;
}

function readRequestId(res: Response): string | undefined {
  return res.headers.get("x-request-id") ?? res.headers.get("x-correlation-id") ?? undefined;
}

export function normalizeApiError(res: Response, bodyText: string): NormalizedApiError {
  const status = res.status;
  const retryable = status === 408 || status === 429 || status >= 500;
  const parsed = parseJsonBody(bodyText);
  const code = readErrorCode(parsed) ?? "UNKNOWN";
  const known = friendlyMessageForCode(code);
  const detail = readDetail(parsed);
  const fallback = fallbackFriendlyMessage();
  const title = known?.title ?? fallback.title;
  const descriptionParts = [known?.description ?? detail ?? fallback.description];
  const requestId = readRequestId(res);
  if (requestId) descriptionParts.push(`Reference: ${requestId}`);
  const description = descriptionParts.filter(Boolean).join(" ");
  return {
    code,
    status,
    retryable,
    title,
    description,
    requestId,
    rawBody: bodyText || undefined,
  };
}

export async function apiFetch(
  path: string,
  init: RequestInit & { skipJson?: boolean } = {},
): Promise<Response> {
  const base = publicBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const nextInit: RequestInit = { ...init, headers };

  const res = await fetch(url, nextInit);
  return res;
}

export async function apiFetchJson<T>(
  path: string,
  init?: RequestInit & { skipJson?: boolean },
): Promise<T> {
  const res = await apiFetch(path, init);
  const text = await res.text();
  if (!res.ok) {
    const normalized = normalizeApiError(res, text);
    throw new AppHttpError(normalized);
  }
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
