import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { updateJobInterview } from "@/lib/recruiting/job-interviews";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PatchSchema = z.object({
  outcome: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
  scorecardJson: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      notes: z.string().max(4000).optional(),
    })
    .passthrough()
    .optional(),
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
    const interview = await updateJobInterview(auth, id, body);
    return jsonV1(interview, auth.correlationId);
  });
}
