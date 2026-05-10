import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { advanceApplicationStage } from "@/lib/recruiting/applications";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const StagePatchSchema = z.object({
  toStage: z.enum([
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "HIRED",
    "REJECTED",
    "WITHDRAWN",
  ]),
  /** Required when `toStage === "HIRED"` — references an APPROVED HIRE proposal. */
  proposalId: z.string().uuid().nullable().optional(),
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

    const body = StagePatchSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );

    const updated = await advanceApplicationStage(auth, {
      applicationId: id,
      toStage: body.toStage,
      proposalId: body.proposalId ?? null,
    });

    return jsonV1(
      {
        applicationId: updated.id,
        stage: updated.stage,
      },
      auth.correlationId,
    );
  });
}
