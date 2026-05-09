import type { HighStakesActionType } from "@/app/generated/prisma/client";
import type { Prisma } from "@/app/generated/prisma/client";

import { appendGovernanceAudit } from "@/lib/governance/audit";
import { GovernanceViolation } from "@/lib/governance/errors";
import {
  EXPLANATION_SCHEMA_V1,
  hashExplanationPayload,
  parseExplanationPayloadV1,
} from "@/lib/governance/explanations";
import { assertValidProposalTransition } from "@/lib/governance/hitl";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import type { Permission } from "@/lib/security/permissions";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface CreateProposalInput {
  featureKey: string;
  subjectType: string;
  subjectRef: string;
  proposedActionType: HighStakesActionType;
  modelVersion?: string | null;
  datasetSnapshotId?: string | null;
  /** Present for API requests; validated immediately in `createDecisionProposal`. */
  explanation?: unknown;
}

export async function createDecisionProposal(
  auth: AuthContext,
  input: CreateProposalInput,
) {
  if (input.explanation === undefined) {
    throw new GovernanceViolation("explanation is required");
  }
  const payload = parseExplanationPayloadV1(input.explanation);
  const contentHash = hashExplanationPayload(payload);

  return withAuthorizedTransaction(
    prisma,
    auth,
    { permission: "governance:ai_propose" },
    async (tx) => {
    const snapshot = await tx.aiExplanationSnapshot.create({
      data: {
        tenantId: auth.tenantId,
        schemaVersion: EXPLANATION_SCHEMA_V1,
        payload: payload as unknown as Prisma.InputJsonValue,
        contentHash,
      },
    });

    const proposal = await tx.aiDecisionProposal.create({
      data: {
        tenantId: auth.tenantId,
        featureKey: input.featureKey,
        subjectType: input.subjectType,
        subjectRef: input.subjectRef,
        proposedActionType: input.proposedActionType,
        status: "PROPOSED",
        modelVersion: input.modelVersion ?? null,
        datasetSnapshotId: input.datasetSnapshotId ?? null,
        explanationSnapshotId: snapshot.id,
        proposedBySubjectId: auth.subjectId,
      },
    });

    await appendGovernanceAudit(tx, {
      tenantId: auth.tenantId,
      eventType: "ai_proposal_created",
      actorSubjectId: auth.subjectId,
      entityType: "AiDecisionProposal",
      entityId: proposal.id,
      correlationId: auth.correlationId,
      metadata: {
        featureKey: input.featureKey,
        proposedActionType: input.proposedActionType,
        explanationSnapshotId: snapshot.id,
      },
    });

    return proposal;
    },
  );
}

export type ProposalTransitionAction =
  | "submit_for_review"
  | "approve"
  | "reject";

export async function transitionDecisionProposal(
  auth: AuthContext,
  proposalId: string,
  action: ProposalTransitionAction,
  reviewNotes?: string | null,
) {
  const permission: Permission =
    action === "submit_for_review"
      ? "governance:ai_propose"
      : "governance:ai_approve";

  return withAuthorizedTransaction(
    prisma,
    auth,
    { permission },
    async (tx) => {
    const proposal = await tx.aiDecisionProposal.findFirst({
      where: { id: proposalId, tenantId: auth.tenantId },
    });

    if (!proposal) {
      throw new GovernanceViolation("Proposal not found");
    }

    let nextStatus: typeof proposal.status;

    if (action === "submit_for_review") {
      assertValidProposalTransition(proposal.status, "AWAITING_REVIEW");
      nextStatus = "AWAITING_REVIEW";
    } else if (action === "approve") {
      assertValidProposalTransition(proposal.status, "APPROVED");
      nextStatus = "APPROVED";
    } else {
      assertValidProposalTransition(proposal.status, "REJECTED");
      nextStatus = "REJECTED";
    }

    const needsReviewFields = action === "approve" || action === "reject";

    const updated = await tx.aiDecisionProposal.update({
      where: { id: proposal.id },
      data: {
        status: nextStatus,
        ...(needsReviewFields
          ? {
              reviewedBySubjectId: auth.subjectId,
              reviewedAt: new Date(),
              reviewNotes: reviewNotes ?? null,
            }
          : {}),
      },
    });

    await appendGovernanceAudit(tx, {
      tenantId: auth.tenantId,
      eventType: `ai_proposal_${action}`,
      actorSubjectId: auth.subjectId,
      entityType: "AiDecisionProposal",
      entityId: proposal.id,
      correlationId: auth.correlationId,
      metadata: { from: proposal.status, to: nextStatus },
    });

    return updated;
    },
  );
}