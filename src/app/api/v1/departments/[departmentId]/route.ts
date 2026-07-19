import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { getDepartment } from "@/lib/core-hr/departments";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const departmentIdParamSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ departmentId: string }> },
) {
  const pathname = new URL(request.url).pathname;
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const { departmentId } = await context.params;
    const parsed = departmentIdParamSchema.safeParse(departmentId);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_department_id",
      });
    }

    const department = await getDepartment(auth, parsed.data);
    return jsonV1({ department }, auth.correlationId);
  });
}
