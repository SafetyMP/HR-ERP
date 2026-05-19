import { createHash, randomBytes } from "node:crypto";

import { fetchOidcDiscoveryDocument } from "@/lib/security/oidc-discovery";

const STATE_COOKIE = "hrerp_oidc_state";
const PKCE_COOKIE = "hrerp_oidc_pkce";

export function oidcConfigured(): boolean {
  return Boolean(
    process.env.OIDC_ISSUER?.trim() &&
      process.env.OIDC_CLIENT_ID?.trim() &&
      process.env.OIDC_REDIRECT_URI?.trim(),
  );
}

export function oidcRedirectUri(): string {
  const uri = process.env.OIDC_REDIRECT_URI?.trim();
  if (!uri) {
    throw new Error("OIDC_REDIRECT_URI is required when OIDC_ISSUER is set");
  }
  return uri;
}

function base64Url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function createOidcState(): string {
  return base64Url(randomBytes(24));
}

export function createPkcePair(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(
    createHash("sha256").update(verifier).digest(),
  );
  return { verifier, challenge };
}

export async function buildAuthorizationUrl(state: string, challenge: string): Promise<string> {
  const issuer = process.env.OIDC_ISSUER!.trim().replace(/\/+$/, "");
  const doc = await fetchOidcDiscoveryDocument(issuer);
  if (!doc.authorization_endpoint) {
    throw new Error("OIDC discovery document missing authorization_endpoint");
  }
  const url = new URL(doc.authorization_endpoint);
  url.searchParams.set("client_id", process.env.OIDC_CLIENT_ID!.trim());
  url.searchParams.set("redirect_uri", oidcRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", process.env.OIDC_SCOPES?.trim() || "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

export async function exchangeAuthorizationCode(
  code: string,
  verifier: string,
): Promise<{ access_token?: string; id_token?: string }> {
  const issuer = process.env.OIDC_ISSUER!.trim().replace(/\/+$/, "");
  const doc = await fetchOidcDiscoveryDocument(issuer);
  if (!doc.token_endpoint) {
    throw new Error("OIDC discovery document missing token_endpoint");
  }
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: oidcRedirectUri(),
    client_id: process.env.OIDC_CLIENT_ID!.trim(),
    code_verifier: verifier,
  });
  const clientSecret = process.env.OIDC_CLIENT_SECRET?.trim();
  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }
  const res = await fetch(doc.token_endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`OIDC token exchange failed: HTTP ${res.status}`);
  }
  return (await res.json()) as { access_token?: string; id_token?: string };
}

export function oidcStateSetCookieHeader(state: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${STATE_COOKIE}=${encodeURIComponent(state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export function oidcPkceSetCookieHeader(verifier: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${PKCE_COOKIE}=${encodeURIComponent(verifier)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export function readOidcStateFromCookie(cookieHeader: string | null): string | null {
  return readNamedCookie(cookieHeader, STATE_COOKIE);
}

export function readPkceVerifierFromCookie(cookieHeader: string | null): string | null {
  return readNamedCookie(cookieHeader, PKCE_COOKIE);
}

export function clearOidcTransientCookies(): string[] {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    `${PKCE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  ];
}

function readNamedCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${name}=`)) continue;
    const raw = trimmed.slice(name.length + 1);
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}
