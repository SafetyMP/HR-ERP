import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { getCurrentPaystub } from "@/lib/paystub/get-current-paystub";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const stub = await getCurrentPaystub(auth);
    return jsonV1({ paystub: stub }, auth.correlationId);
  });
}
