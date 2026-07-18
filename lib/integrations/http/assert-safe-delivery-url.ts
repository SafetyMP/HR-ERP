import { URL } from "node:url";

/**
 * Reject SSRF-prone partner delivery URLs (non-HTTPS, private/link-local, localhost).
 */
export function assertSafeDeliveryUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("invalid_delivery_url");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("delivery_url_must_be_https");
  }

  // Node may return IPv6 hostnames with brackets (e.g. "[::ffff:a00:8]").
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "metadata.google.internal" ||
    host.endsWith(".internal")
  ) {
    throw new Error("delivery_url_host_blocked");
  }

  if (isPrivateOrLinkLocalHost(host)) {
    throw new Error("delivery_url_private_host_blocked");
  }

  const allow = (process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allow.length > 0 && !allow.includes(host)) {
    throw new Error("delivery_url_host_not_allowlisted");
  }

  return parsed;
}

function isPrivateOrLinkLocalHost(host: string): boolean {
  // IPv4 dotted quads
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  // IPv6 unique-local / link-local / IPv4-mapped (coarse)
  if (host.includes(":")) {
    const h = host.toLowerCase();
    // Node may normalize ::ffff:10.0.0.8 → ::ffff:a00:8
    const dottedMapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(h);
    if (dottedMapped) {
      return isPrivateOrLinkLocalHost(dottedMapped[1]);
    }
    const hexMapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(h);
    if (hexMapped) {
      const hi = Number.parseInt(hexMapped[1], 16);
      const lo = Number.parseInt(hexMapped[2], 16);
      const a = (hi >> 8) & 0xff;
      const b = hi & 0xff;
      const c = (lo >> 8) & 0xff;
      const d = lo & 0xff;
      return isPrivateOrLinkLocalHost(`${a}.${b}.${c}.${d}`);
    }
    if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) {
      return true;
    }
  }
  return false;
}
