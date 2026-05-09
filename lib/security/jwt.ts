import type { JWTPayload } from "jose";
import { jwtVerify } from "jose";

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

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

export async function verifyHrJwt(token: string): Promise<HrJwtClaims> {
  const secret = requireEnv("JWT_SECRET");
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    algorithms: ["HS256"],
  });
  return payload as HrJwtClaims;
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
