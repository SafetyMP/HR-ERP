import type { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const ALLOWED_CYCLE_TRANSITIONS = {
  DRAFT: new Set(["OPEN"] as const),
  OPEN: new Set(["REVIEW", "CLOSED"] as const),
  REVIEW: new Set(["APPROVED", "CLOSED"] as const),
  APPROVED: new Set(["APPLIED", "CLOSED"] as const),
  APPLIED: new Set(["CLOSED"] as const),
  CLOSED: new Set([] as const),
} as const;

type CompCycleStatus = keyof typeof ALLOWED_CYCLE_TRANSITIONS;

export function assertValidCompensationCycleTransition(
  from: CompCycleStatus,
  to: CompCycleStatus,
): void {
  if (!ALLOWED_CYCLE_TRANSITIONS[from].has(to as never)) {
    throw new ApiError(409, {
      code: "comp_cycle_transition_invalid",
      message: `cannot transition compensation cycle from ${from} to ${to}`,
    });
  }
}

export interface CreateCompensationCycleInput {
  name: string;
  cycleType: "MERIT" | "BONUS" | "EQUITY_GRANT";
  effectiveDate: string;
  currencyCode: string;
}

export async function createCompensationCycle(
  auth: AuthContext,
  input: CreateCompensationCycleInput,
) {
  if (!/^[A-Z]{3}$/.test(input.currencyCode)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "currencyCode must be ISO 4217 ALPHA-3",
    });
  }
  const effective = new Date(input.effectiveDate);
  if (Number.isNaN(effective.getTime())) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "effectiveDate must be ISO yyyy-mm-dd",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "compensation:cycle_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const cycle = await tx.compensationCycle.create({
        data: {
          tenantId: auth.tenantId,
          name: input.name.trim(),
          cycleType: input.cycleType,
          effectiveDate: effective,
          currencyCode: input.currencyCode.toUpperCase(),
          status: "DRAFT",
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.compensation",
        eventType: "compensation.cycle.created",
        correlationId: auth.correlationId,
        payload: { cycleId: cycle.id, cycleType: cycle.cycleType },
      });

      return cycle;
    },
  );
}

export async function transitionCompensationCycle(
  auth: AuthContext,
  cycleId: string,
  toStatus: CompCycleStatus,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "compensation:cycle_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const cycle = await tx.compensationCycle.findFirst({
        where: { id: cycleId, tenantId: auth.tenantId },
      });
      if (!cycle) {
        throw new ApiError(404, {
          code: "not_found",
          message: "compensation_cycle_not_found",
        });
      }
      assertValidCompensationCycleTransition(
        cycle.status as CompCycleStatus,
        toStatus,
      );

      const updated = await tx.compensationCycle.update({
        where: { id: cycle.id },
        data: {
          status: toStatus,
          closedAt: toStatus === "CLOSED" ? new Date() : null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.compensation",
        eventType: "compensation.cycle.status_changed",
        correlationId: auth.correlationId,
        payload: { cycleId: cycle.id, fromStatus: cycle.status, toStatus },
      });

      return updated;
    },
  );
}

export async function listCompensationCycles(
  auth: AuthContext,
  filter: { status?: string } = {},
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "compensation:cycle_read",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const where: Prisma.CompensationCycleWhereInput = {
        tenantId: auth.tenantId,
      };
      if (filter.status) {
        where.status =
          filter.status as Prisma.CompensationCycleWhereInput["status"];
      }
      return tx.compensationCycle.findMany({
        where,
        orderBy: [{ effectiveDate: "desc" }],
        take: 100,
      });
    },
  );
}
