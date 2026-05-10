import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Canonicalize a value into a deterministic JSON string. Object keys are
 * sorted lexicographically so the same logical payload always produces the
 * same byte sequence — this is what we sign. Recursive: handles nested objects
 * and arrays. Functions / undefined values are dropped (matching JSON semantics).
 */
export function canonicalJson(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "null";
    return Number.isInteger(value) ? value.toString() : value.toString();
  }
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "bigint") return JSON.stringify(value.toString());
  if (Array.isArray(value)) {
    return `[${value.map((v) => stringify(v ?? null)).join(",")}]`;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && typeof v !== "function")
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${stringify(v ?? null)}`);
    return `{${entries.join(",")}}`;
  }
  return "null";
}

const SIGNATURE_HEADER_VERSION = "v1";

export interface SignatureBundle {
  /** Header to attach: `X-HRERP-Signature-256`. */
  header: string;
  /** Hex-encoded raw HMAC-SHA256 — persisted in `webhook_deliveries.signature`. */
  hex: string;
  /** ISO-8601 timestamp emitted in the delivery for replay protection. */
  timestamp: string;
}

/**
 * Compute the canonical signature bundle for an outbound webhook.
 *
 * Signature input is `{timestamp}.{canonical(body)}` so the receiver can both
 * re-derive the canonical bytes and reject replays whose timestamp is outside
 * an acceptable window (default 5 minutes — enforced by `verifySignature`).
 */
export function signWebhookPayload(
  body: unknown,
  secret: string,
  timestamp: string = new Date().toISOString(),
): SignatureBundle {
  const canonical = canonicalJson(body);
  const mac = createHmac("sha256", secret)
    .update(`${timestamp}.${canonical}`)
    .digest("hex");
  return {
    header: `${SIGNATURE_HEADER_VERSION},t=${timestamp},mac=${mac}`,
    hex: mac,
    timestamp,
  };
}

export interface VerifyOptions {
  /** Maximum drift between `timestamp` and now() in milliseconds. */
  toleranceMs?: number;
  /** Override the wallclock; primarily for tests. */
  now?: () => Date;
}

/**
 * Verify a signature header produced by `signWebhookPayload`. Returns `true` on
 * a constant-time match, `false` otherwise. Designed for ingress endpoints
 * (e.g. carrier callbacks, Slack interactive payloads).
 */
export function verifySignature(
  header: string,
  body: unknown,
  secret: string,
  opts: VerifyOptions = {},
): boolean {
  const parsed = parseSignatureHeader(header);
  if (!parsed) return false;
  const tolerance = opts.toleranceMs ?? 5 * 60 * 1000;
  const ts = Date.parse(parsed.timestamp);
  if (Number.isNaN(ts)) return false;
  const now = (opts.now ?? (() => new Date()))().getTime();
  if (Math.abs(now - ts) > tolerance) return false;

  const expected = signWebhookPayload(body, secret, parsed.timestamp).hex;
  if (expected.length !== parsed.mac.length) return false;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(parsed.mac, "hex"));
}

interface ParsedSignatureHeader {
  version: string;
  timestamp: string;
  mac: string;
}

function parseSignatureHeader(input: string): ParsedSignatureHeader | null {
  const parts = input.split(",").map((s) => s.trim());
  const version = parts[0];
  if (!version || !version.startsWith("v")) return null;
  const map: Record<string, string> = {};
  for (const part of parts.slice(1)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    map[part.slice(0, eq)] = part.slice(eq + 1);
  }
  if (!map.t || !map.mac) return null;
  return { version, timestamp: map.t, mac: map.mac };
}
