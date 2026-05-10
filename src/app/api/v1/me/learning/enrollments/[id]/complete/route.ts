import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { completeSelfEnrollment } from "@/lib/learning/courses";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CompleteSchema = z
  .object({
    scoreBp: z.number().int().min(0).max(10000).optional(),
  })
  .strict();

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

    const body = CompleteSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const enrollment = await completeSelfEnrollment(auth, id, body.scoreBp);
    return jsonV1(
      {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        completedAt: enrollment.completedAt?.toISOString() ?? null,
      },
      auth.correlationId,
    );
  });
}
