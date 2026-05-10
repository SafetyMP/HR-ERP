import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { transitionRequisitionStatus } from "@/lib/recruiting/requisitions";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED", "FILLED"]),
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

    const updated = await transitionRequisitionStatus(auth, id, body.status);
    return jsonV1(
      {
        requisitionId: updated.id,
        status: updated.status,
      },
      auth.correlationId,
    );
  });
}
