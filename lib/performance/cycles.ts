import type { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const ALLOWED_CYCLE_TRANSITIONS: Record<
  "DRAFT" | "OPEN" | "CALIBRATION" | "CLOSED",
  ReadonlySet<"DRAFT" | "OPEN" | "CALIBRATION" | "CLOSED">
> = {
  DRAFT: new Set(["OPEN"] as const),
  OPEN: new Set(["CALIBRATION", "CLOSED"] as const),
  CALIBRATION: new Set(["CLOSED"] as const),
  CLOSED: new Set([] as const),
};

export function assertValidCycleTransition(
  from: "DRAFT" | "OPEN" | "CALIBRATION" | "CLOSED",
  to: "DRAFT" | "OPEN" | "CALIBRATION" | "CLOSED",
): void {
  if (!ALLOWED_CYCLE_TRANSITIONS[from].has(to)) {
    throw new ApiError(409, {
      code: "cycle_transition_invalid",
      message: `cannot transition performance cycle from ${from} to ${to}`,
    });
  }
}

export interface CreatePerformanceCycleInput {
  name: string;
  startDate: string;
  endDate: string;
  ratingScaleMax?: number;
}

export async function createPerformanceCycle(
  auth: AuthContext,
  input: CreatePerformanceCycleInput,
) {
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "startDate / endDate must be ISO yyyy-mm-dd",
    });
  }
  if (end <= start) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "endDate must be strictly after startDate",
    });
  }
  if (
    input.ratingScaleMax !== undefined &&
    (input.ratingScaleMax < 3 || input.ratingScaleMax > 7)
  ) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "ratingScaleMax must be between 3 and 7",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:cycle_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const cycle = await tx.performanceCycle.create({
        data: {
          tenantId: auth.tenantId,
          name: input.name.trim(),
          startDate: start,
          endDate: end,
          ratingScaleMax: input.ratingScaleMax ?? 5,
          status: "DRAFT",
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "performance.cycle.created",
        correlationId: auth.correlationId,
        payload: { cycleId: cycle.id, name: cycle.name },
      });

      return cycle;
    },
  );
}

export async function transitionPerformanceCycle(
  auth: AuthContext,
  cycleId: string,
  toStatus: "OPEN" | "CALIBRATION" | "CLOSED",
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:cycle_write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const cycle = await tx.performanceCycle.findFirst({
        where: { id: cycleId, tenantId: auth.tenantId },
      });
      if (!cycle) {
        throw new ApiError(404, {
          code: "not_found",
          message: "performance_cycle_not_found",
        });
      }
      assertValidCycleTransition(cycle.status, toStatus);

      const updated = await tx.performanceCycle.update({
        where: { id: cycle.id },
        data: {
          status: toStatus,
          closedAt: toStatus === "CLOSED" ? new Date() : null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "performance.cycle.status_changed",
        correlationId: auth.correlationId,
        payload: {
          cycleId: cycle.id,
          fromStatus: cycle.status,
          toStatus,
        },
      });

      return updated;
    },
  );
}

export async function listPerformanceCycles(
  auth: AuthContext,
  filter: { status?: string } = {},
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "performance:cycle_read",
      resourceClassification: "internal",
    },
    async (tx) => {
      const where: Prisma.PerformanceCycleWhereInput = { tenantId: auth.tenantId };
      if (filter.status) {
        where.status =
          filter.status as Prisma.PerformanceCycleWhereInput["status"];
      }
      return tx.performanceCycle.findMany({
        where,
        orderBy: [{ startDate: "desc" }],
        take: 200,
      });
    },
  );
}
