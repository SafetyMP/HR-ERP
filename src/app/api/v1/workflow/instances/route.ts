import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { startWorkflowInstance } from "@/lib/workflow/engine";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const StartSchema = z.object({
  definitionCode: z.string().min(1).max(80),
  subjectType: z.string().min(1).max(120),
  subjectRef: z.string().min(1).max(200),
  context: z.record(z.string(), z.unknown()).optional(),
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
    assertAbac(auth, policy.abac, "internal");

    const body = StartSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const instance = await startWorkflowInstance(auth, body);
    return jsonV1(
      {
        instanceId: instance.id,
        status: instance.status,
        currentStepIndex: instance.currentStepIndex,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
