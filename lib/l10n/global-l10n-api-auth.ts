import { ApiError } from "@/lib/api/v1/errors";
import { assertNonProductionDemoApi } from "@/lib/api/non-production-route";
import type { AuthContext } from "@/lib/security/auth-context";
import { assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";

/**
 * Authenticates global-l10n demo APIs. In production, routes are disabled unless
 * ALLOW_DEMO_API_ROUTES=1; when enabled, requires HR admin list access.
 */
export async function requireGlobalL10nApiAuth(
  request: Request,
): Promise<AuthContext> {
  assertNonProductionDemoApi("global_l10n");
  const auth = await requireBearerAuth(request);
  assertPermission(auth, "employees:list");
  return auth;
}

export function resolveL10nTenantId(
  auth: AuthContext,
  bodyTenantId: string | undefined,
): string {
  if (bodyTenantId && bodyTenantId !== auth.tenantId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "tenant_mismatch",
    });
  }
  return auth.tenantId;
}
