import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { applyRecommendation } from "@/lib/compensation/recommendations";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const ApplySchema = z.object({
  authorizingProposalId: z.string().uuid(),
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
    assertAbac(auth, policy.abac, "confidential");

    const body = ApplySchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const rec = await applyRecommendation(
      auth,
      id,
      body.authorizingProposalId,
    );
    return jsonV1(
      {
        recommendationId: rec.id,
        status: rec.status,
        appliedAt: rec.appliedAt?.toISOString() ?? null,
      },
      auth.correlationId,
    );
  });
}
