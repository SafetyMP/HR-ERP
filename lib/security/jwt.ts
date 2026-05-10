import type { JWTPayload, JWTVerifyOptions } from "jose";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

import type { AuthContext } from "@/lib/security/auth-context";
import type { MfaLevel } from "@/lib/security/abac-attributes";
import type { Role } from "@/lib/security/permissions";
import { ROLES } from "@/lib/security/permissions";

export interface HrJwtClaims extends JWTPayload {
  tenant_id?: string;
  roles?: Role[];
  org_unit_id?: string;
  subject_employee_id?: string;
  manager_employee_id?: string;
  mfa_level?: MfaLevel;
}

// Minimum acceptable length matches `npm run security:scan` and the
// `/docs/operations/vercel-managed-phase1-environment.md` guidance.
const MIN_JWT_SECRET_LENGTH = 16;

const ASYMMETRIC_ALGOS = [
  "RS256",
  "RS384",
  "RS512",
  "ES256",
  "ES384",
  "ES512",
  "PS256",
  "PS384",
  "PS512",
] as const;
type AsymmetricAlg = (typeof ASYMMETRIC_ALGOS)[number];

interface JwksConfig {
  issuer?: string;
  audience?: string;
  jwksUri: string;
  algorithms: readonly AsymmetricAlg[];
}

let cachedRemoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedRemoteJwksUri: string | null = null;

/**
 * Production deployments should issue tokens from an external IdP (Auth0, WorkOS, Okta,
 * Entra, Keycloak) and configure `JWT_ISSUER_MODE=jwks` + `JWT_JWKS_URI`. The HS256 path
 * remains available for local dev and CI, but is intentionally **not** the recommended
 * production posture. See `docs/security/identity-and-jwks.md`.
 */
function readJwksConfig(): JwksConfig | null {
  const mode = (process.env.JWT_ISSUER_MODE ?? "hs256").toLowerCase();
  if (mode !== "jwks" && mode !== "oidc") return null;

  const jwksUri = (process.env.JWT_JWKS_URI ?? "").trim();
  if (!jwksUri) {
    throw new Error("JWT_ISSUER_MODE=jwks requires JWT_JWKS_URI to be set");
  }

  const algosRaw = (process.env.JWT_ACCEPTED_ALGS ?? "RS256")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const algorithms = algosRaw.filter((a): a is AsymmetricAlg =>
    (ASYMMETRIC_ALGOS as readonly string[]).includes(a),
  );
  if (algorithms.length === 0) {
    throw new Error(
      `JWT_ACCEPTED_ALGS contains no supported asymmetric algorithm; allowed: ${ASYMMETRIC_ALGOS.join(",")}`,
    );
  }

  return {
    issuer: process.env.JWT_ISSUER?.trim() || undefined,
    audience: process.env.JWT_AUDIENCE?.trim() || undefined,
    jwksUri,
    algorithms,
  };
}

function requireJwtSecret(): string {
  const raw = process.env.JWT_SECRET ?? "";
  const trimmed = raw.trim();
  if (trimmed.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be set (min ${MIN_JWT_SECRET_LENGTH} chars after trim); ` +
        `received length=${trimmed.length}. Set it on Vercel ` +
        "(Production + Preview + Development) and locally in .env.",
    );
  }
  return trimmed;
}

function getRemoteJwks(jwksUri: string): ReturnType<typeof createRemoteJWKSet> {
  if (cachedRemoteJwks && cachedRemoteJwksUri === jwksUri) {
    return cachedRemoteJwks;
  }
  cachedRemoteJwks = createRemoteJWKSet(new URL(jwksUri), {
    cooldownDuration: 30_000,
    cacheMaxAge: 10 * 60_000,
  });
  cachedRemoteJwksUri = jwksUri;
  return cachedRemoteJwks;
}

export async function verifyHrJwt(token: string): Promise<HrJwtClaims> {
  const jwks = readJwksConfig();
  if (jwks) {
    const verifyOpts: JWTVerifyOptions = {
      algorithms: [...jwks.algorithms],
      ...(jwks.issuer ? { issuer: jwks.issuer } : {}),
      ...(jwks.audience ? { audience: jwks.audience } : {}),
    };
    const keys = getRemoteJwks(jwks.jwksUri);
    const { payload } = await jwtVerify(token, keys, verifyOpts);
    return payload as HrJwtClaims;
  }

  const secret = requireJwtSecret();
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });
  return payload as HrJwtClaims;
}

export async function signHrAccessToken(params: {
  sub: string;
  tenantId: string;
  roles: Role[];
  subjectEmployeeId?: string;
  managerEmployeeId?: string;
  orgUnitId?: string;
  mfaLevel?: MfaLevel;
  /** jose-supported exp, e.g. `3600s`, `1h` */
  expiresIn: string;
}): Promise<string> {
  const secret = requireJwtSecret();
  const key = new TextEncoder().encode(secret);

  const payload: Record<string, unknown> = {
    tenant_id: params.tenantId,
    roles: params.roles,
    mfa_level: params.mfaLevel ?? "standard",
  };
  if (params.subjectEmployeeId) {
    payload.subject_employee_id = params.subjectEmployeeId;
  }
  if (params.managerEmployeeId) {
    payload.manager_employee_id = params.managerEmployeeId;
  }
  if (params.orgUnitId) {
    payload.org_unit_id = params.orgUnitId;
  }

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(params.sub)
    .setIssuedAt()
    .setExpirationTime(params.expiresIn)
    .sign(key);
}

export function claimsToAuthContext(
  payload: HrJwtClaims,
  correlationId: string,
): AuthContext {
  const subjectId = typeof payload.sub === "string" ? payload.sub : "";
  const tenantId =
    typeof payload.tenant_id === "string" ? payload.tenant_id : "";

  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((r): r is Role =>
        (ROLES as readonly string[]).includes(r as string),
      )
    : [];

  const mfaLevel: MfaLevel =
    payload.mfa_level === "step_up" ||
    payload.mfa_level === "standard" ||
    payload.mfa_level === "none"
      ? payload.mfa_level
      : "none";

  return {
    subjectId,
    tenantId,
    roles,
    orgUnitId:
      typeof payload.org_unit_id === "string"
        ? payload.org_unit_id
        : undefined,
    subjectEmployeeId:
      typeof payload.subject_employee_id === "string"
        ? payload.subject_employee_id
        : undefined,
    managerEmployeeId:
      typeof payload.manager_employee_id === "string"
        ? payload.manager_employee_id
        : undefined,
    mfaLevel,
    correlationId,
  };
}
