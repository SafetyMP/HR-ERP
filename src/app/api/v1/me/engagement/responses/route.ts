import { z } from "zod";

import { assertTrackDApiAllowed } from "@/lib/api/v1/track-d-guard";
import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { submitResponse } from "@/lib/engagement/surveys";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const SubmitSchema = z.object({
  surveyId: z.string().uuid(),
  score: z.number().int().min(0).max(10),
  comment: z.string().max(4000).nullable().optional(),
});

export async function POST(request: Request) {
  assertTrackDApiAllowed();
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

    const body = SubmitSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const response = await submitResponse(auth, {
      surveyId: body.surveyId,
      score: body.score,
      comment: body.comment ?? null,
    });
    return jsonV1(
      {
        responseId: response.id,
        surveyId: response.surveyId,
        submittedAt: response.submittedAt.toISOString(),
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
