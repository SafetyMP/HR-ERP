import { z } from "zod";

import { assertTrackDApiAllowed } from "@/lib/api/v1/track-d-guard";
import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { decideCurrentStep } from "@/lib/workflow/engine";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const DecideSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().max(2000).nullable().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  assertTrackDApiAllowed();
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

    const body = DecideSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const instance = await decideCurrentStep(auth, {
      instanceId: id,
      decision: body.decision,
      note: body.note ?? null,
    });
    return jsonV1(
      {
        instanceId: instance.id,
        status: instance.status,
        currentStepIndex: instance.currentStepIndex,
        completedAt: instance.completedAt?.toISOString() ?? null,
      },
      auth.correlationId,
    );
  });
}
