import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createPerformanceGoal } from "@/lib/performance/goals";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateTeamGoalSchema = z.object({
  cycleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  weightBp: z.number().int().min(0).max(10000).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
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

    const body = CreateTeamGoalSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const goal = await createPerformanceGoal(auth, {
      cycleId: body.cycleId,
      employeeId: body.employeeId,
      title: body.title,
      description: body.description ?? null,
      weightBp: body.weightBp,
      dueDate: body.dueDate ?? null,
      isSelf: false,
    });
    return jsonV1(
      {
        goalId: goal.id,
        cycleId: goal.cycleId,
        employeeId: goal.employeeId,
        title: goal.title,
        status: goal.status,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
