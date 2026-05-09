import type { MfaLevel } from "@/lib/security/abac-attributes";
import type { Role } from "@/lib/security/permissions";
import { roleHasPermission, type Permission } from "@/lib/security/permissions";

export interface AuthContext {
  subjectId: string;
  tenantId: string;
  roles: Role[];
  orgUnitId?: string;
  subjectEmployeeId?: string;
  managerEmployeeId?: string;
  mfaLevel: MfaLevel;
  correlationId: string;
}

export function authHasPermission(
  auth: AuthContext,
  permission: Permission,
): boolean {
  return auth.roles.some((r) => roleHasPermission(r, permission));
}
