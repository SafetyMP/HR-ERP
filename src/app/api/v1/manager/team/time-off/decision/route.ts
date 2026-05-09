import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { patchManagerTeamTimeOffDecision } from "@/lib/leave/manager-team-time-off-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { z } from "zod";

const bodySchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["APPROVED", "DENIED"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  const pathname = new URL(request.url).pathname;

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

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "validation_error",
        message: "leave_decision_invalid_body",
      });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "leave_decision_invalid_body",
      });
    }

    const row = await patchManagerTeamTimeOffDecision(auth, {
      requestId: parsed.data.requestId,
      decision: parsed.data.decision,
      note: parsed.data.note,
    });
    return jsonV1({ managerTeamTimeOffRequest: row }, auth.correlationId);
  });
}
