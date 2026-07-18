import { ApiError } from "@/lib/api/v1/errors";
import { GovernanceViolation } from "@/lib/governance/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface CreateRecommendationInput {
  cycleId: string;
  employeeId: string;
  baseIncreaseAmountMinor?: bigint | string | null;
  bonusAmountMinor?: bigint | string | null;
  equityGrantShares?: bigint | string | null;
  justification?: string | null;
}

function toBigIntOrNull(
  value: bigint | string | null | undefined,
): bigint | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "bigint") return value;
  if (!/^-?\d+$/.test(value)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "amount must be an integer string",
    });
  }
  return BigInt(value);
}

export async function createRecommendation(
  auth: AuthContext,
  input: CreateRecommendationInput,
) {
  const baseMinor = toBigIntOrNull(input.baseIncreaseAmountMinor ?? null);
  const bonusMinor = toBigIntOrNull(input.bonusAmountMinor ?? null);
  const equityShares = toBigIntOrNull(input.equityGrantShares ?? null);

  if (baseMinor === null && bonusMinor === null && equityShares === null) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "at least one of base/bonus/equity must be provided",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "compensation:recommend_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const cycle = await tx.compensationCycle.findFirst({
        where: { id: input.cycleId, tenantId: auth.tenantId },
      });
      if (!cycle) {
        throw new ApiError(404, {
          code: "not_found",
          message: "compensation_cycle_not_found",
        });
      }
      if (cycle.status !== "OPEN" && cycle.status !== "REVIEW") {
        throw new ApiError(409, {
          code: "cycle_not_authoring",
          message: `cannot author recommendations when cycle status is ${cycle.status}`,
        });
      }

      const rec = await tx.compensationRecommendation.upsert({
        where: {
          tenantId_cycleId_employeeId: {
            tenantId: auth.tenantId,
            cycleId: cycle.id,
            employeeId: input.employeeId,
          },
        },
        update: {
          status: "DRAFT",
          baseIncreaseAmountMinor: baseMinor,
          bonusAmountMinor: bonusMinor,
          equityGrantShares: equityShares,
          justification: input.justification ?? null,
        },
        create: {
          tenantId: auth.tenantId,
          cycleId: cycle.id,
          employeeId: input.employeeId,
          status: "DRAFT",
          baseIncreaseAmountMinor: baseMinor,
          bonusAmountMinor: bonusMinor,
          equityGrantShares: equityShares,
          justification: input.justification ?? null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.compensation",
        eventType: "compensation.recommendation.drafted",
        correlationId: auth.correlationId,
        payload: {
          recommendationId: rec.id,
          cycleId: cycle.id,
          employeeId: input.employeeId,
        },
        dedupeKey: `compensation.recommendation.drafted:${rec.id}`,
        dedupeWindowMs: 30_000,
      });

      return rec;
    },
  );
}

/**
 * Finalize a DRAFT/APPROVED recommendation by referencing an APPROVED
 * `COMPENSATION_CHANGE`-class governance proposal that names this recommendation.
 * Sets status to APPLIED — downstream payroll/equity systems consume the event.
 */
export async function applyRecommendation(
  auth: AuthContext,
  recommendationId: string,
  authorizingProposalId: string,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "compensation:recommend_apply",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const rec = await tx.compensationRecommendation.findFirst({
        where: { id: recommendationId, tenantId: auth.tenantId },
      });
      if (!rec) {
        throw new ApiError(404, {
          code: "not_found",
          message: "compensation_recommendation_not_found",
        });
      }
      if (rec.status === "APPLIED" || rec.status === "REJECTED") {
        throw new ApiError(409, {
          code: "recommendation_state_invalid",
          message: `recommendation already ${rec.status.toLowerCase()}`,
        });
      }

      const proposal = await tx.aiDecisionProposal.findFirst({
        where: { id: authorizingProposalId, tenantId: auth.tenantId },
      });
      if (!proposal) {
        throw new GovernanceViolation("Authorizing proposal not found");
      }
      if (proposal.status !== "APPROVED") {
        throw new GovernanceViolation(
          `Compensation apply blocked: proposal status is ${proposal.status}; APPROVED is required`,
        );
      }
      if (proposal.proposedActionType !== "COMPENSATION_CHANGE") {
        throw new GovernanceViolation(
          "Authorizing proposal must be COMPENSATION_CHANGE-class",
        );
      }
      if (
        proposal.subjectType !== "CompensationRecommendation" ||
        proposal.subjectRef !== rec.id
      ) {
        throw new GovernanceViolation(
          "Authorizing proposal must reference this recommendation",
        );
      }

      const updated = await tx.compensationRecommendation.update({
        where: { id: rec.id },
        data: {
          status: "APPLIED",
          authorizingProposalId,
          appliedAt: new Date(),
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.compensation",
        eventType: "compensation.recommendation.applied",
        correlationId: auth.correlationId,
        payload: {
          recommendationId: rec.id,
          cycleId: rec.cycleId,
          employeeId: rec.employeeId,
          authorizingProposalId,
        },
      });

      return updated;
    },
  );
}
