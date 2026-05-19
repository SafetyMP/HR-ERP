import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { lockPayrollPeriod } from "@/lib/payroll/payroll-filing-service";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";

export async function POST(
  request: Request,
  context: { params: Promise<{ periodId: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { periodId } = await context.params;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const result = await lockPayrollPeriod(auth, periodId);
    return jsonV1(result, auth.correlationId);
  });
}
