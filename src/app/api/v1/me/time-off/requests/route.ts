import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createMyTimeOffRequest,
  listMyTimeOffRequests,
} from "@/lib/time-off/time-off-requests-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/me/time-off/requests";

const createBodySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(500).optional(),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const timeOffRequests = await listMyTimeOffRequests(auth);
    return { timeOffRequests };
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
        message: "time_off_invalid_body",
      });
    }

    const parsed = createBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "time_off_invalid_body",
      });
    }

    const timeOffRequest = await createMyTimeOffRequest(auth, parsed.data);
    return jsonV1({ timeOffRequest }, auth.correlationId);
  });
}
