import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { parseJsonBodyLimited } from "@/lib/api/v1/read-json-limited";
import { createJobRole, listJobRoles } from "@/lib/core-hr/job-roles";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateJobRoleSchema = z
  .object({
    title: z.string().min(1).max(200),
    level: z.string().max(80).nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
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

    const jobRoles = await listJobRoles(auth);
    return jsonV1({ jobRoles }, auth.correlationId);
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

    const body = await parseJsonBodyLimited(request, CreateJobRoleSchema);
    const jobRole = await createJobRole(auth, body);
    return jsonV1({ jobRole }, auth.correlationId, { status: 201 });
  });
}
