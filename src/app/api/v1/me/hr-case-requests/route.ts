import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createMyHrCaseRequest } from "@/lib/hr-case/create-hr-case-request";
import { listMyHrCaseRequests } from "@/lib/hr-case/hr-case-requests-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/me/hr-case-requests";

const bodySchema = z.object({
  category: z.enum(["PAYROLL", "BENEFITS", "HR_OTHER"]),
  body: z.string().min(8).max(4000),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const hrCaseRequests = await listMyHrCaseRequests(auth);
    return { hrCaseRequests };
  },
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
        message: "hr_case_invalid_body",
      });
    }

    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "hr_case_invalid_body",
      });
    }

    const hrCaseRequest = await createMyHrCaseRequest(auth, parsed.data);
    return jsonV1({ hrCaseRequest }, auth.correlationId);
  });
}
