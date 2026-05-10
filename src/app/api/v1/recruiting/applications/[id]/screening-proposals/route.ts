import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { proposeApplicationScreening } from "@/lib/recruiting/screening";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const ProposeSchema = z.object({
  rationale: z.string().min(1).max(8000),
  modelVersion: z.string().max(120).nullable().optional(),
  factors: z
    .array(
      z.object({
        label: z.string().min(1).max(120),
        direction: z.enum(["increases_score", "decreases_score", "neutral"]),
        detail: z.string().max(500).optional(),
      }),
    )
    .max(20)
    .optional(),
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

    const body = ProposeSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );

    const result = await proposeApplicationScreening(auth, {
      applicationId: id,
      rationale: body.rationale,
      modelVersion: body.modelVersion ?? null,
      factors: body.factors,
    });

    return jsonV1(result, auth.correlationId, { status: 201 });
  });
}
