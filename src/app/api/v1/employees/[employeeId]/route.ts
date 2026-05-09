import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { getEmployeePublicProfile } from "@/lib/employees/public-profile";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";

const employeeIdParamSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ employeeId: string }> },
) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const { employeeId } = await context.params;
    const parsed = employeeIdParamSchema.safeParse(employeeId);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_employee_id",
      });
    }

    const data = await getEmployeePublicProfile(auth, parsed.data);
    return jsonV1(data, auth.correlationId);
  });
}
