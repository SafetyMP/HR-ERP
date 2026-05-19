import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createBenefitLifeEvent,
  listMyBenefitLifeEvents,
} from "@/lib/benefits/benefit-life-events";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PostSchema = z.object({
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

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");
    const events = await listMyBenefitLifeEvents(auth);
    return jsonV1({ events }, auth.correlationId);
  });
}

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
    const body = PostSchema.parse(await request.json().catch(() => ({})));
    const event = await createBenefitLifeEvent(auth, body);
    return jsonV1(event, auth.correlationId, { status: 201 });
  });
}
