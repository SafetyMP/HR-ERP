import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createBenefitElectionChangeRequest } from "@/lib/benefits/create-benefit-election-change-request";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { z } from "zod";

const bodySchema = z.object({
  category: z.enum(["MEDICAL", "DENTAL", "VISION", "INCOME_PROTECTION", "RETIREMENT"]),
  summary: z.string().min(8).max(2000),
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

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "validation_error",
        message: "benefit_intent_invalid_body",
      });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "benefit_intent_invalid_body",
      });
    }

    const row = await createBenefitElectionChangeRequest(auth, parsed.data);
    return jsonV1({ benefitElectionChangeRequest: row }, auth.correlationId);
  });
}
