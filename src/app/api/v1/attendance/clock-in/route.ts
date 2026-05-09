import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { clockInSelf } from "@/lib/attendance/clock-in-self";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { parseJsonBody } from "@/lib/api/v1/json-body";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";

const clockInBodySchema = z.object({
  idempotencyKey: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const body = await parseJsonBody(request, clockInBodySchema);
    const data = await clockInSelf(auth, body.idempotencyKey);
    return jsonV1(data, auth.correlationId);
  });
}
