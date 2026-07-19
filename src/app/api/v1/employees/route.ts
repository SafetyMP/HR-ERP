import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { parseJsonBodyLimited } from "@/lib/api/v1/read-json-limited";
import { createEmployee, listEmployeesClosed } from "@/lib/core-hr/employees";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateEmployeeSchema = z
  .object({
    email: z.string().email().max(320),
    departmentId: z.string().uuid(),
    jobRoleId: z.string().uuid(),
    firstName: z.string().max(120).nullable().optional(),
    lastName: z.string().max(120).nullable().optional(),
    preferredName: z.string().max(120).nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
    status: z.enum(["ACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  })
  .strict();

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  const url = new URL(request.url);

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

    const departmentId = url.searchParams.get("departmentId") ?? undefined;
    const jobRoleId = url.searchParams.get("jobRoleId") ?? undefined;
    if (departmentId && !z.string().uuid().safeParse(departmentId).success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_department_id",
      });
    }
    if (jobRoleId && !z.string().uuid().safeParse(jobRoleId).success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_job_role_id",
      });
    }

    const employees = await listEmployeesClosed(auth, { departmentId, jobRoleId });
    return jsonV1({ employees }, auth.correlationId);
  });
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
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

    const body = await parseJsonBodyLimited(request, CreateEmployeeSchema);
    const employee = await createEmployee(auth, body);
    return jsonV1({ employee }, auth.correlationId, { status: 201 });
  });
}
