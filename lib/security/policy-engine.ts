import {
  type AbacConstraints,
  type DataClassification,
  classificationAllowed,
  mfaSatisfies,
} from "@/lib/security/abac-attributes";
import {
  authHasPermission,
  type AuthContext,
} from "@/lib/security/auth-context";
import type { Permission } from "@/lib/security/permissions";

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertPermission(
  auth: AuthContext,
  permission: Permission,
): void {
  if (!authHasPermission(auth, permission)) {
    throw new AuthorizationError("missing_permission");
  }
}

export function assertAbac(
  auth: AuthContext,
  constraints: AbacConstraints | undefined,
  resourceClassification: DataClassification = "internal",
): void {
  if (!constraints) return;

  if (!mfaSatisfies(auth.mfaLevel, constraints.minMfa)) {
    throw new AuthorizationError("step_up_required");
  }

  if (
    constraints.maxDataClassification &&
    !classificationAllowed(
      resourceClassification,
      constraints.maxDataClassification,
    )
  ) {
    throw new AuthorizationError("data_classification_denied");
  }
}

export function assertTenantScopedSubject(auth: AuthContext): void {
  if (!auth.tenantId || !auth.subjectId) {
    throw new AuthorizationError("invalid_principal");
  }
}

/** Narrow employees:read without employees:list to self-service reads only. */
export function assertEmployeeRecordReadable(
  auth: AuthContext,
  employeeId: string,
): void {
  if (authHasPermission(auth, "employees:list")) return;
  if (!auth.subjectEmployeeId || auth.subjectEmployeeId !== employeeId) {
    throw new AuthorizationError("employee_scope_denied");
  }
}
