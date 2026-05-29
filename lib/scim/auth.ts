import { timingSafeEqual } from "node:crypto";

import { ApiError } from "@/lib/api/v1/errors";

const HEADER = "authorization";

/**
 * SCIM 2.0 admin authentication. The IdP authenticates with a long-lived bearer token
 * (RFC 7644 §2). Tokens are configured per-tenant via `SCIM_TENANT_TOKENS` — a JSON
 * map of `tenantId -> { token, audience? }`. The token is stored as plaintext in env;
 * deployments should source it from a secrets manager and rotate quarterly.
 */
export interface ScimTenantBinding {
  tenantId: string;
}

interface ScimTokenEntry {
  tenantId: string;
  tokens: string[];
}

let cached: { raw: string; entries: ScimTokenEntry[] } | null = null;

function loadEntries(): ScimTokenEntry[] {
  const raw = process.env.SCIM_TENANT_TOKENS ?? "";
  if (!raw.trim()) return [];
  if (cached && cached.raw === raw) return cached.entries;
  let parsed: Record<string, { token?: string; previousToken?: string }>;
  try {
    parsed = JSON.parse(raw) as Record<string, { token?: string; previousToken?: string }>;
  } catch {
    throw new Error("SCIM_TENANT_TOKENS must be valid JSON");
  }
  const entries: ScimTokenEntry[] = [];
  for (const [tenantId, value] of Object.entries(parsed)) {
    const tokens: string[] = [];
    for (const candidate of [value?.token, value?.previousToken]) {
      const t = candidate?.trim();
      if (t && t.length >= 24 && !tokens.includes(t)) tokens.push(t);
    }
    if (tenantId && tokens.length > 0) {
      entries.push({ tenantId, tokens });
    }
  }
  cached = { raw, entries };
  return entries;
}

function matchToken(presented: string, candidate: string): boolean {
  if (presented.length !== candidate.length) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(candidate);
  return timingSafeEqual(a, b);
}

export function requireScimBinding(request: Request): ScimTenantBinding {
  const authz = request.headers.get(HEADER);
  if (!authz?.startsWith("Bearer ")) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "scim_token_missing",
    });
  }
  const presented = authz.slice("Bearer ".length).trim();
  if (!presented) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "scim_token_missing",
    });
  }
  const entries = loadEntries();
  for (const entry of entries) {
    for (const token of entry.tokens) {
      if (matchToken(presented, token)) {
        return { tenantId: entry.tenantId };
      }
    }
  }
  throw new ApiError(401, {
    code: "unauthorized",
    message: "scim_token_invalid",
  });
}
