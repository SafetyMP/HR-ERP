import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createBenefitLifeEvent,
  listMyBenefitLifeEvents,
} from "@/lib/benefits/benefit-life-events";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/me/benefits/life-events";

const postSchema = z.object({
  eventType: z.enum([
    "MARRIAGE",
    "BIRTH_ADOPTION",
    "DIVORCE",
    "LOSS_OF_COVERAGE",
    "OTHER",
  ]),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().max(2000).optional(),
});

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const events = await listMyBenefitLifeEvents(auth);
    return { events };
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
        message: "life_event_invalid_body",
      });
    }

    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "life_event_invalid_body",
      });
    }

    const event = await createBenefitLifeEvent(auth, parsed.data);
    return jsonV1({ event }, auth.correlationId);
  });
}
