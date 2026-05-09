import { randomUUID } from "node:crypto";

import type { AuthContext } from "@/lib/security/auth-context";
import type { Role } from "@/lib/security/permissions";
import { ROLES } from "@/lib/security/permissions";
import { claimsToAuthContext, verifyHrJwt } from "@/lib/security/jwt";

function parseRolesHeader(raw: string): Role[] {
  return raw
    .split(",")
    .map((r) => r.trim())
    .filter((r): r is Role => (ROLES as readonly string[]).includes(r));
}

/**
 * Resolves AuthContext for governance routes: Bearer JWT, or (dev-only) headers
 * when ALLOW_DEV_GOVERNANCE_HEADERS=true.
 */
export async function getGovernanceAuth(request: Request): Promise<AuthContext> {
  const correlationId =
    request.headers.get("x-correlation-id") ?? randomUUID();

  const authz = request.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    const token = authz.slice("Bearer ".length);
    const claims = await verifyHrJwt(token);
    return claimsToAuthContext(claims, correlationId);
  }

  if (process.env.ALLOW_DEV_GOVERNANCE_HEADERS === "true") {
    const tenantId = request.headers.get("x-tenant-id") ?? "";
    const subjectId = request.headers.get("x-subject-id") ?? "";
    const rolesHeader = request.headers.get("x-roles") ?? "hr_admin";
    const roles = parseRolesHeader(rolesHeader);
    return {
      subjectId,
      tenantId,
      roles: roles.length > 0 ? roles : ["hr_admin"],
      mfaLevel: "none",
      correlationId,
    };
  }

  throw new Error("Missing or invalid Authorization for governance API");
}
