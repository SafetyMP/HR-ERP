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

// Minimum acceptable length matches `npm run security:scan` and the
// `/docs/operations/vercel-managed-phase1-environment.md` guidance.
const MIN_JWT_SECRET_LENGTH = 16;

/**
 * Load the HS256 secret at request time. Server-side `process.env.X` reads
 * inside Node-runtime route handlers are NOT inlined by Next.js / Webpack
 * (only `NEXT_PUBLIC_*` is). Earlier obscured access patterns (dynamic
 * `import("node:process")` + array-joined keys) were chasing a phantom and
 * masked the real failure mode — an empty Vercel dashboard value baked into
 * `.next/standalone/.env`. Direct access keeps the failure loud.
 */
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

export async function verifyHrJwt(token: string): Promise<HrJwtClaims> {
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
