import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createApplication } from "@/lib/recruiting/applications";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateApplicationSchema = z.object({
  requisitionId: z.string().uuid(),
  candidate: z.object({
    fullName: z.string().min(1).max(200),
    email: z.string().email().max(254),
    phone: z.string().max(50).nullable().optional(),
    sourceChannel: z
      .enum([
        "CAREERS_SITE",
        "EMPLOYEE_REFERRAL",
        "AGENCY",
        "LINKEDIN",
        "JOB_BOARD",
        "EVENT",
        "OTHER",
      ])
      .optional(),
  }),
  note: z.string().max(2000).nullable().optional(),
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
    assertAbac(auth, policy.abac, "confidential");

    const body = CreateApplicationSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const result = await createApplication(auth, body);
    return jsonV1(
      {
        applicationId: result.application.id,
        requisitionId: result.application.requisitionId,
        candidateId: result.candidate.id,
        stage: result.application.stage,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
