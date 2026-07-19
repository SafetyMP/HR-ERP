import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { parseJsonBodyLimited } from "@/lib/api/v1/read-json-limited";
import { createDepartment, listDepartments } from "@/lib/core-hr/departments";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateDepartmentSchema = z
  .object({
    name: z.string().min(1).max(200),
    code: z.string().min(1).max(80),
    parentId: z.string().uuid().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict();

export async function GET(request: Request) {
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

    const departments = await listDepartments(auth);
    return jsonV1({ departments }, auth.correlationId);
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
    assertAbac(auth, policy.abac, "internal");

    const body = await parseJsonBodyLimited(request, CreateDepartmentSchema);
    const department = await createDepartment(auth, body);
    return jsonV1({ department }, auth.correlationId, { status: 201 });
  });
}
