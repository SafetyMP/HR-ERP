import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import {
  getMyOnboardingTasks,
  patchMyOnboardingTask,
} from "@/lib/onboarding/onboarding-tasks-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { z } from "zod";

const patchBodySchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
});

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
    assertAbac(auth, policy.abac, "internal");

    const tasks = await getMyOnboardingTasks(auth);
    return jsonV1({ onboardingTasks: tasks }, auth.correlationId);
  });
}

export async function PATCH(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("PATCH", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "validation_error",
        message: "onboarding_invalid_body",
      });
    }

    const parsed = patchBodySchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "onboarding_invalid_body",
      });
    }

    const task = await patchMyOnboardingTask(auth, parsed.data);
    return jsonV1({ onboardingTask: task }, auth.correlationId);
  });
}
