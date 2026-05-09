import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { reviewHrCaseRequest } from "@/lib/hr-case/hr-case-requests-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { z } from "zod";

const bodySchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["OPEN", "ACKNOWLEDGED", "NEEDS_INFO", "RESOLVED"]),
  employeeVisibleNote: z.string().max(1000).nullable().optional(),
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
        message: "hr_case_review_invalid_body",
      });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "hr_case_review_invalid_body",
      });
    }

    const row = await reviewHrCaseRequest(auth, parsed.data);
    return jsonV1({ hrCaseRequest: row }, auth.correlationId);
  });
}
