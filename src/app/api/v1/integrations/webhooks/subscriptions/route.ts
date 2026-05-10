import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { createSubscription } from "@/lib/webhooks/scheduler";

const CreateSchema = z.object({
  label: z.string().min(1).max(120),
  targetUrl: z.string().url(),
  eventTypes: z.array(z.string().min(1).max(120)).min(1).max(50),
  secret: z.string().min(32).max(256),
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

    const body = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const sub = await createSubscription(auth, body);
    return jsonV1(
      {
        subscriptionId: sub.id,
        label: sub.label,
        eventTypes: sub.eventTypes,
        isActive: sub.isActive,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
