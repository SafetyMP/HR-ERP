import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { submitSelfPerformanceReview } from "@/lib/performance/reviews-v2";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PatchSchema = z.object({
  selfRating: z.number().int(),
  selfNote: z.string().max(4000).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;

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
    const body = PatchSchema.parse(await request.json().catch(() => ({})));
    const review = await submitSelfPerformanceReview(auth, id, body);
    return jsonV1(review, auth.correlationId);
  });
}
