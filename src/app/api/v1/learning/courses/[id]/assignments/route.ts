import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { assignCourse } from "@/lib/learning/courses";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const AssignSchema = z.object({
  employeeIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;
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

    const body = AssignSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const result = await assignCourse(auth, {
      courseId: id,
      employeeIds: body.employeeIds,
    });
    return jsonV1(result, auth.correlationId, { status: 201 });
  });
}
