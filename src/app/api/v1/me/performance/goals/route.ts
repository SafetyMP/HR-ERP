import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createPerformanceGoal,
  listGoalsForEmployee,
} from "@/lib/performance/goals";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSelfGoalSchema = z.object({
  cycleId: z.string().uuid(),
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

    const body = CreateSelfGoalSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const employeeId = auth.subjectEmployeeId ?? auth.subjectId;
    if (!employeeId) {
      throw new ApiError(403, {
        code: "forbidden",
        message: "employee_context_required",
      });
    }

    const goal = await createPerformanceGoal(auth, {
      cycleId: body.cycleId,
      employeeId,
      title: body.title,
      description: body.description ?? null,
      weightBp: body.weightBp,
      dueDate: body.dueDate ?? null,
      isSelf: true,
    });
    return jsonV1(
      {
        goalId: goal.id,
        cycleId: goal.cycleId,
        title: goal.title,
        status: goal.status,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", url.pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const employeeId = auth.subjectEmployeeId ?? auth.subjectId;
    if (!employeeId) {
      throw new ApiError(403, {
        code: "forbidden",
        message: "employee_context_required",
      });
    }

    const cycleId = url.searchParams.get("cycleId") ?? undefined;
    const rows = await listGoalsForEmployee(auth, employeeId, cycleId);
    return jsonV1(
      {
        goals: rows.map((g) => ({
          id: g.id,
          cycleId: g.cycleId,
          title: g.title,
          status: g.status,
          weightBp: g.weightBp,
          percentCompleteBp: g.percentCompleteBp,
          dueDate: g.dueDate ? g.dueDate.toISOString().slice(0, 10) : null,
        })),
      },
      auth.correlationId,
    );
  });
}
