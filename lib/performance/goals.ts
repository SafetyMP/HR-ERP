import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface CreateGoalInput {
  cycleId: string;
  employeeId: string;
  title: string;
  description?: string | null;
  weightBp?: number;
  dueDate?: string | null;
  /** When true, the caller is the employee writing their own goal — only allowed for own row. */
  isSelf?: boolean;
}

export async function createPerformanceGoal(
  auth: AuthContext,
  input: CreateGoalInput,
) {
  const selfEmployeeId = auth.subjectEmployeeId ?? auth.subjectId;
  if (input.isSelf && input.employeeId !== selfEmployeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "self-goal write must target the calling subject",
    });
  }
  if (
    input.weightBp !== undefined &&
    (input.weightBp < 0 || input.weightBp > 10000)
  ) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "weightBp must be between 0 and 10000 basis points",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: input.isSelf
        ? "performance:goal_self_write"
        : "performance:goal_team_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const cycle = await tx.performanceCycle.findFirst({
        where: { id: input.cycleId, tenantId: auth.tenantId },
      });
      if (!cycle) {
        throw new ApiError(404, {
          code: "not_found",
          message: "performance_cycle_not_found",
        });
      }
      if (cycle.status !== "OPEN") {
        throw new ApiError(409, {
          code: "cycle_not_open",
          message: `cannot author goals when cycle status is ${cycle.status}`,
        });
      }

      const goal = await tx.performanceGoal.create({
        data: {
          tenantId: auth.tenantId,
          cycleId: cycle.id,
          employeeId: input.employeeId,
          title: input.title.trim(),
          description: input.description ?? null,
          weightBp: input.weightBp ?? 0,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          status: "ACTIVE",
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "performance.goal.created",
        correlationId: auth.correlationId,
        payload: { goalId: goal.id, cycleId: cycle.id, employeeId: input.employeeId },
      });

      return goal;
    },
  );
}

export async function listGoalsForEmployee(
  auth: AuthContext,
  employeeId: string,
  cycleId?: string,
) {
  const selfId = auth.subjectEmployeeId ?? auth.subjectId;
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission:
        employeeId === selfId ? "performance:goal_self_write" : "performance:cycle_read",
      resourceClassification: "internal",
    },
    async (tx) =>
      tx.performanceGoal.findMany({
        where: {
          tenantId: auth.tenantId,
          employeeId,
          ...(cycleId ? { cycleId } : {}),
        },
        orderBy: [{ createdAt: "desc" }],
        take: 200,
      }),
  );
}

/** Goals for direct reports only — manager JWT must carry `subject_employee_id`. */
export async function listGoalsForDirectReports(
  auth: AuthContext,
  cycleId?: string,
) {
  const managerId = auth.subjectEmployeeId;
  if (!managerId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:goal_team_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const reports = await tx.employee.findMany({
        where: { tenantId: auth.tenantId, managerId },
        select: { id: true },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        take: 100,
      });
      const ids = reports.map((r) => r.id);
      if (ids.length === 0) {
        return [];
      }

      const goals = await tx.performanceGoal.findMany({
        where: {
          tenantId: auth.tenantId,
          employeeId: { in: ids },
          ...(cycleId ? { cycleId } : {}),
        },
        orderBy: [{ employeeId: "asc" }, { createdAt: "desc" }],
        take: 500,
      });

      const empIds = [...new Set(goals.map((g) => g.employeeId))];
      const employees = await tx.employee.findMany({
        where: { tenantId: auth.tenantId, id: { in: empIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
        },
      });
      const byId = new Map(employees.map((e) => [e.id, e]));

      return goals.map((g) => {
        const employee = byId.get(g.employeeId);
        return {
          ...g,
          employee:
            employee ?? {
              id: g.employeeId,
              firstName: "",
              lastName: "",
              preferredName: null as string | null,
            },
        };
      });
    },
  );
}
