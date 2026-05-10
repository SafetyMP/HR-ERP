/**
 * Minimal OIDC discovery client.
 *
 * Fetches `${issuer}/.well-known/openid-configuration` and caches the result for
 * `OIDC_DISCOVERY_TTL_MS` (default 10 minutes). The response is used to populate
 * `JWT_JWKS_URI` and `JWT_ISSUER` at startup so operators do not have to hand-edit
 * those values when rotating IdPs.
 *
 * This module deliberately does not implement an authorization-code flow — that
 * lives in the marketplace adapter (`lib/auth/<provider>/`). It only resolves the
 * keys + issuer + audiences for token verification.
 */

export interface OidcDiscoveryDocument {
  issuer: string;
  jwks_uri: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  userinfo_endpoint?: string;
  introspection_endpoint?: string;
  end_session_endpoint?: string;
  id_token_signing_alg_values_supported?: string[];
  scopes_supported?: string[];
}

interface CacheEntry {
  fetchedAt: number;
  document: OidcDiscoveryDocument;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL_MS = 10 * 60_000;

function ttlMs(): number {
  const raw = process.env.OIDC_DISCOVERY_TTL_MS;
  if (!raw) return DEFAULT_TTL_MS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_TTL_MS;
}

export function clearOidcDiscoveryCache(): void {
  cache.clear();
}

export async function fetchOidcDiscoveryDocument(
  issuer: string,
): Promise<OidcDiscoveryDocument> {
  const trimmed = issuer.replace(/\/+$/, "");
  const cached = cache.get(trimmed);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < ttlMs()) {
    return cached.document;
  }

  const url = `${trimmed}/.well-known/openid-configuration`;
  const res = await fetch(url, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `OIDC discovery failed: ${url} returned HTTP ${res.status}`,
    );
  }
  const document = (await res.json()) as OidcDiscoveryDocument;
  if (!document.issuer || !document.jwks_uri) {
    throw new Error(
      `OIDC discovery document missing required fields (issuer, jwks_uri) at ${url}`,
    );
  }
  cache.set(trimmed, { fetchedAt: now, document });
  return document;
}
