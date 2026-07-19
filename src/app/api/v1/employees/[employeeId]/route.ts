import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { parseJsonBodyLimited } from "@/lib/api/v1/read-json-limited";
import { patchEmployee } from "@/lib/core-hr/employees";
import { getEmployeePublicProfile } from "@/lib/employees/public-profile";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const employeeIdParamSchema = z.string().uuid();

const PatchEmployeeSchema = z
  .object({
    email: z.string().email().max(320).optional(),
    firstName: z.string().max(120).nullable().optional(),
    lastName: z.string().max(120).nullable().optional(),
    preferredName: z.string().max(120).nullable().optional(),
    departmentId: z.string().uuid().optional(),
    jobRoleId: z.string().uuid().optional(),
    managerId: z.string().uuid().nullable().optional(),
    status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  })
  .strict();

export async function GET(
  request: Request,
  context: { params: Promise<{ employeeId: string }> },
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ employeeId: string }> },
) {
  const pathname = new URL(request.url).pathname;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("PATCH", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const { employeeId } = await context.params;
    const parsed = employeeIdParamSchema.safeParse(employeeId);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_employee_id",
      });
    }

    const body = await parseJsonBodyLimited(request, PatchEmployeeSchema);
    const employee = await patchEmployee(auth, parsed.data, body);
    return jsonV1({ employee }, auth.correlationId);
  });
}
