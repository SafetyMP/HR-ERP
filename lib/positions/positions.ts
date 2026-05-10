import { ApiError } from "@/lib/api/v1/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const POSITION_TRANSITIONS: Record<
  "PROPOSED" | "APPROVED" | "ACTIVE" | "FROZEN" | "CLOSED",
  ReadonlySet<"PROPOSED" | "APPROVED" | "ACTIVE" | "FROZEN" | "CLOSED">
> = {
  PROPOSED: new Set(["APPROVED", "CLOSED"] as const),
  APPROVED: new Set(["ACTIVE", "FROZEN", "CLOSED"] as const),
  ACTIVE: new Set(["FROZEN", "CLOSED"] as const),
  FROZEN: new Set(["ACTIVE", "CLOSED"] as const),
  CLOSED: new Set([] as const),
};

export function assertValidPositionTransition(
  from: keyof typeof POSITION_TRANSITIONS,
  to: keyof typeof POSITION_TRANSITIONS,
): void {
  if (!POSITION_TRANSITIONS[from].has(to)) {
    throw new ApiError(409, {
      code: "position_transition_invalid",
      message: `cannot transition position from ${from} to ${to}`,
    });
  }
}

export interface CreatePositionInput {
  code: string;
  title: string;
  jobRoleId?: string | null;
  departmentId?: string | null;
  parentPositionId?: string | null;
  headcount?: number;
  fteBasisPoints?: number;
  effectiveFrom: string;
}

export async function createPosition(
  auth: AuthContext,
  input: CreatePositionInput,
) {
  if (input.headcount !== undefined && (input.headcount < 1 || input.headcount > 1000)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "headcount must be between 1 and 1000",
    });
  }
  if (
    input.fteBasisPoints !== undefined &&
    (input.fteBasisPoints <= 0 || input.fteBasisPoints > 10000)
  ) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "fteBasisPoints must be in (0, 10000]",
    });
  }
  const effective = new Date(input.effectiveFrom);
  if (Number.isNaN(effective.getTime())) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "effectiveFrom must be ISO yyyy-mm-dd",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "position:write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const pos = await tx.position.create({
        data: {
          tenantId: auth.tenantId,
          code: input.code.trim(),
          title: input.title.trim(),
          jobRoleId: input.jobRoleId ?? null,
          departmentId: input.departmentId ?? null,
          parentPositionId: input.parentPositionId ?? null,
          headcount: input.headcount ?? 1,
          fteBasisPoints: input.fteBasisPoints ?? 10000,
          effectiveFrom: effective,
          status: "PROPOSED",
        },
      });
      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.core_hr",
        eventType: "position.created",
        correlationId: auth.correlationId,
        payload: { positionId: pos.id, code: pos.code },
      });
      return pos;
    },
  );
}

export async function transitionPosition(
  auth: AuthContext,
  id: string,
  toStatus: keyof typeof POSITION_TRANSITIONS,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "position:write",
      resourceClassification: "internal",
    },
    async (tx) => {
      const pos = await tx.position.findFirst({
        where: { id, tenantId: auth.tenantId },
      });
      if (!pos) {
        throw new ApiError(404, {
          code: "not_found",
          message: "position_not_found",
        });
      }
      assertValidPositionTransition(
        pos.status as keyof typeof POSITION_TRANSITIONS,
        toStatus,
      );
      return tx.position.update({
        where: { id: pos.id },
        data: {
          status: toStatus,
          closedAt: toStatus === "CLOSED" ? new Date() : null,
        },
      });
    },
  );
}
