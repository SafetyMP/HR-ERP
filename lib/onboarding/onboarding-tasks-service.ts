import type { OnboardingStatus } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type OnboardingTaskPayload = {
  id: string;
  title: string;
  status: OnboardingStatus;
  dueAt: string | null;
  updatedAt: string;
};

export async function getMyOnboardingTasks(auth: AuthContext): Promise<OnboardingTaskPayload[]> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "onboarding:read",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const scoped = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        select: { id: true },
      });
      if (!scoped) {
        throw new ApiError(404, {
          code: "not_found",
          message: "employee_not_found",
        });
      }

      const rows = await tx.onboardingTask.findMany({
        where: { employeeId },
        orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      });

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        dueAt: row.dueAt ? row.dueAt.toISOString().slice(0, 10) : null,
        updatedAt: row.updatedAt.toISOString(),
      }));
    },
  );
}

export async function patchMyOnboardingTask(
  auth: AuthContext,
  input: { taskId: string; status: OnboardingStatus },
): Promise<OnboardingTaskPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "onboarding:write",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const existing = await tx.onboardingTask.findFirst({
        where: { id: input.taskId, employeeId },
      });

      if (!existing) {
        throw new ApiError(404, {
          code: "not_found",
          message: "onboarding_task_not_found",
        });
      }

      const order: OnboardingStatus[] = ["PENDING", "IN_PROGRESS", "DONE"];
      const curIdx = order.indexOf(existing.status);
      const nextIdx = order.indexOf(input.status);
      if (nextIdx === -1 || nextIdx < curIdx) {
        throw new ApiError(400, {
          code: "bad_request",
          message: "onboarding_invalid_status_transition",
        });
      }

      const row =
        nextIdx === curIdx
          ? existing
          : await tx.onboardingTask.update({
              where: { id: existing.id },
              data: { status: input.status },
            });

      return {
        id: row.id,
        title: row.title,
        status: row.status,
        dueAt: row.dueAt ? row.dueAt.toISOString().slice(0, 10) : null,
        updatedAt: row.updatedAt.toISOString(),
      };
    },
  );
}
