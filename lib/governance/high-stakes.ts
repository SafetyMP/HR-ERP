import type { HighStakesActionType } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";

import { appendGovernanceAudit } from "@/lib/governance/audit";
import { GovernanceViolation } from "@/lib/governance/errors";

export interface ExecuteHighStakesParams {
  tenantId: string;
  proposalId: string;
  performedBySubjectId: string;
  actionKind: HighStakesActionType;
  externalRef?: string | null;
  correlationId?: string | null;
}

/**
 * Persists a human-triggered high-stakes employment action only when the linked
 * proposal is APPROVED. Updates proposal to EXECUTED. Application code must not
 * insert HighStakesEmploymentAction without passing this guard.
 */
export async function executeApprovedProposal(
  tx: Prisma.TransactionClient,
  params: ExecuteHighStakesParams,
): Promise<{ actionId: string }> {
  const proposal = await tx.aiDecisionProposal.findFirst({
    where: { id: params.proposalId, tenantId: params.tenantId },
  });

  if (!proposal) {
    throw new GovernanceViolation("Proposal not found for tenant");
  }

  if (proposal.status !== "APPROVED") {
    throw new GovernanceViolation(
      `High-stakes execution blocked: proposal status is ${proposal.status}; human approval (APPROVED) is required before execution`,
    );
  }

  if (proposal.proposedActionType !== params.actionKind) {
    throw new GovernanceViolation(
      "Action kind does not match the approved proposal",
    );
  }

  const existing = await tx.highStakesEmploymentAction.findUnique({
    where: { proposalId: params.proposalId },
  });

  if (existing) {
    throw new GovernanceViolation("Proposal has already been executed");
  }

  const action = await tx.highStakesEmploymentAction.create({
    data: {
      tenantId: params.tenantId,
      proposalId: params.proposalId,
      actionKind: params.actionKind,
      performedBySubjectId: params.performedBySubjectId,
      externalRef: params.externalRef ?? null,
    },
  });

  await tx.aiDecisionProposal.update({
    where: { id: proposal.id },
    data: {
      status: "EXECUTED",
      executedAt: new Date(),
      executedBySubjectId: params.performedBySubjectId,
    },
  });

  await appendGovernanceAudit(tx, {
    tenantId: params.tenantId,
    eventType: "high_stakes_executed",
    actorSubjectId: params.performedBySubjectId,
    entityType: "HighStakesEmploymentAction",
    entityId: action.id,
    correlationId: params.correlationId,
    metadata: {
      proposalId: params.proposalId,
      actionKind: params.actionKind,
    },
  });

  return { actionId: action.id };
}
