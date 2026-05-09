import type { JWTPayload } from "jose";
import { SignJWT, jwtVerify } from "jose";

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

/**
 * Load HS256 secret at **runtime** (Vercel serverless injects env per cold start).
 * Avoid static `process.env.JWT_SECRET` / sync patterns that Next/Webpack can inline
 * at `next build`. Dynamic `import("node:process")` is not folded the same way.
 */
async function requireJwtSecret(): Promise<string> {
  const { env } = await import("node:process");
  const envKey = ["JWT", "SECRET"].join("_") as "JWT_SECRET";
  const v = env[envKey];
  if (!v) throw new Error("JWT_SECRET is not set");
  const t = v.trim();
  if (!t) throw new Error("JWT_SECRET is not set");
  return t;
}

export async function verifyHrJwt(token: string): Promise<HrJwtClaims> {
  const secret = await requireJwtSecret();
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });
  return payload as HrJwtClaims;
}

/**
 * Returns SHA-256 + length + a 4-char mask of `JWT_SECRET` as it is **actually
 * read** by this serverless function at request time — through the same
 * `requireJwtSecret` accessor used by `verifyHrJwt` and `signHrAccessToken`.
 *
 * For the temporary `/api/v1/_debug/jwt-introspect` route only. The raw secret
 * is never returned. SHA-256 is irreversible; the 4-char mask
 * (e.g. `"ab…cd"`) is for visual sanity vs the mint-side hash and leaks
 * negligible entropy for a 64-hex secret.
 */
export async function inspectJwtSecret(): Promise<{
  sha256: string;
  length: number;
  mask: string;
}> {
  const secret = await requireJwtSecret();
  const { createHash } = await import("node:crypto");
  const sha256 = createHash("sha256").update(secret).digest("hex");
  const mask = `${secret.slice(0, 2)}…${secret.slice(-2)}`;
  return { sha256, length: secret.length, mask };
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
  const secret = await requireJwtSecret();
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
