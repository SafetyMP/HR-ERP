import { randomUUID } from "node:crypto";
import { integrationMetricInc } from "@/lib/integrations/metrics";
import {
  IntegrationHttpError,
  classifyHttpStatus,
} from "@/lib/integrations/errors";
import { parseRetryAfterHeader } from "@/lib/integrations/backoff";

export type IntegrationFetchOptions = Omit<RequestInit, "signal"> & {
  timeoutMs?: number;
  correlationId?: string;
};

const DEFAULT_TIMEOUT_MS = 25_000;

/**
 * Shared HTTP transport: timeouts, Retry-After parsing, error taxonomy, basic metrics.
 */
export async function integrationFetch(
  url: string | URL,
  options: IntegrationFetchOptions = {},
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const correlationId = options.correlationId ?? randomUUID();
  const headers = new Headers(options.headers);
  headers.set("x-correlation-id", correlationId);

  const rest = Object.fromEntries(
    Object.entries(options).filter(
      ([key]) => key !== "timeoutMs" && key !== "correlationId",
    ),
  ) as Omit<IntegrationFetchOptions, "timeoutMs" | "correlationId">;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  const started = Date.now();
  try {
    const res = await fetch(url, {
      ...rest,
      headers,
      signal: ctrl.signal,
    });
    integrationMetricInc("integration_http_requests");
    integrationMetricInc(`integration_http_${res.status}`);
    return res;
  } catch (e) {
    integrationMetricInc("integration_http_errors");
    throw e;
  } finally {
    clearTimeout(t);
    integrationMetricInc("integration_http_latency_ms_sum", Date.now() - started);
  }
}

export async function integrationFetchJson<T>(
  url: string | URL,
  options: IntegrationFetchOptions = {},
): Promise<T> {
  const res = await integrationFetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  const retryAfter = parseRetryAfterHeader(res.headers.get("retry-after"));

  let bodyText = "";
  try {
    bodyText = await res.text();
  } catch {
    bodyText = "";
  }

  if (!res.ok) {
    const cls = classifyHttpStatus(res.status);
    throw new IntegrationHttpError(
      `HTTP ${res.status}: ${bodyText.slice(0, 500)}`,
      res.status,
      cls,
      retryAfter,
      bodyText,
    );
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch (e) {
    throw new IntegrationHttpError(
      "Invalid JSON body",
      res.status || 502,
      "fatal",
      undefined,
      e,
    );
  }
}
