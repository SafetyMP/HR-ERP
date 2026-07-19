import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { getJobRole } from "@/lib/core-hr/job-roles";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const jobRoleIdParamSchema = z.string().uuid();

export async function GET(
  request: Request,
  context: { params: Promise<{ jobRoleId: string }> },
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

    const { jobRoleId } = await context.params;
    const parsed = jobRoleIdParamSchema.safeParse(jobRoleId);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_job_role_id",
      });
    }

    const jobRole = await getJobRole(auth, parsed.data);
    return jsonV1({ jobRole }, auth.correlationId);
  });
}
