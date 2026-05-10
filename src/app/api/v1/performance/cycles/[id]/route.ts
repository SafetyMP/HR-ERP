import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { transitionPerformanceCycle } from "@/lib/performance/cycles";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PatchSchema = z.object({
  status: z.enum(["OPEN", "CALIBRATION", "CLOSED"]),
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
    assertAbac(auth, policy.abac, "internal");

    const body = PatchSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const cycle = await transitionPerformanceCycle(auth, id, body.status);
    return jsonV1(
      { cycleId: cycle.id, status: cycle.status },
      auth.correlationId,
    );
  });
}
