import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createSurvey } from "@/lib/engagement/surveys";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  kind: z.enum(["ENPS", "PULSE", "ANNUAL", "CUSTOM"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  anonymize: z.boolean().optional(),
});

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

    const body = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const survey = await createSurvey(auth, body);
    return jsonV1(
      {
        surveyId: survey.id,
        kind: survey.kind,
        status: survey.status,
        anonymize: survey.anonymize,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
