import type { JobApplicationStage, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { appendGovernanceAudit } from "@/lib/governance/audit";
import { GovernanceViolation } from "@/lib/governance/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const ALLOWED_STAGE_TRANSITIONS: Record<
  JobApplicationStage,
  ReadonlySet<JobApplicationStage>
> = {
  APPLIED: new Set(["SCREENING", "REJECTED", "WITHDRAWN"] as const),
  SCREENING: new Set(["INTERVIEW", "REJECTED", "WITHDRAWN"] as const),
  INTERVIEW: new Set(["OFFER", "REJECTED", "WITHDRAWN"] as const),
  OFFER: new Set(["HIRED", "REJECTED", "WITHDRAWN"] as const),
  HIRED: new Set([] as const),
  REJECTED: new Set([] as const),
  WITHDRAWN: new Set([] as const),
};

export function assertValidStageTransition(
  from: JobApplicationStage,
  to: JobApplicationStage,
): void {
  const allowed = ALLOWED_STAGE_TRANSITIONS[from];
  if (!allowed.has(to)) {
    throw new ApiError(409, {
      code: "stage_transition_invalid",
      message: `cannot transition application from ${from} to ${to}`,
    });
  }
}

export interface CreateApplicationInput {
  requisitionId: string;
  candidate: {
    fullName: string;
    email: string;
    phone?: string | null;
    sourceChannel?:
      | "CAREERS_SITE"
      | "EMPLOYEE_REFERRAL"
      | "AGENCY"
      | "LINKEDIN"
      | "JOB_BOARD"
      | "EVENT"
      | "OTHER";
  };
  note?: string | null;
}

export async function createApplication(
  auth: AuthContext,
  input: CreateApplicationInput,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const requisition = await tx.jobRequisition.findFirst({
        where: { id: input.requisitionId, tenantId: auth.tenantId },
      });
      if (!requisition) {
        throw new ApiError(404, {
          code: "not_found",
          message: "requisition_not_found",
        });
      }
      if (requisition.status !== "OPEN") {
        throw new ApiError(409, {
          code: "requisition_not_open",
          message: `requisition must be OPEN to accept applications (current: ${requisition.status})`,
        });
      }

      const candidate = await tx.candidate.upsert({
        where: {
          tenantId_email: {
            tenantId: auth.tenantId,
            email: input.candidate.email.trim().toLowerCase(),
          },
        },
        update: {
          fullName: input.candidate.fullName,
          phone: input.candidate.phone ?? undefined,
          sourceChannel: input.candidate.sourceChannel ?? undefined,
        },
        create: {
          tenantId: auth.tenantId,
          fullName: input.candidate.fullName,
          email: input.candidate.email.trim().toLowerCase(),
          phone: input.candidate.phone ?? null,
          sourceChannel: input.candidate.sourceChannel ?? "CAREERS_SITE",
        },
      });

      const application = await tx.jobApplication.upsert({
        where: {
          tenantId_requisitionId_candidateId: {
            tenantId: auth.tenantId,
            requisitionId: input.requisitionId,
            candidateId: candidate.id,
          },
        },
        update: {},
        create: {
          tenantId: auth.tenantId,
          requisitionId: input.requisitionId,
          candidateId: candidate.id,
          stage: "APPLIED",
          note: input.note ?? null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.application.created",
        correlationId: auth.correlationId,
        payload: {
          applicationId: application.id,
          requisitionId: input.requisitionId,
          candidateId: candidate.id,
        },
      });

      return { application, candidate };
    },
  );
}

export async function listApplicationsForRequisition(
  auth: AuthContext,
  requisitionId: string,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_read",
      resourceClassification: "confidential",
    },
    async (tx) => {
      return tx.jobApplication.findMany({
        where: { requisitionId, tenantId: auth.tenantId },
        orderBy: [{ stage: "asc" }, { appliedAt: "desc" }],
        include: {
          candidate: {
            select: {
              id: true,
              fullName: true,
              email: true,
              sourceChannel: true,
              anonymizedPseudonym: true,
            },
          },
        },
      });
    },
  );
}

export interface AdvanceStageInput {
  applicationId: string;
  toStage: JobApplicationStage;
  proposalId?: string | null;
}

/**
 * Advance an application's stage. Transition to HIRED requires an APPROVED
 * `HIRE`-class AiDecisionProposal — see `lib/governance/high-stakes.ts`.
 */
export async function advanceApplicationStage(
  auth: AuthContext,
  input: AdvanceStageInput,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const application = await tx.jobApplication.findFirst({
        where: { id: input.applicationId, tenantId: auth.tenantId },
      });
      if (!application) {
        throw new ApiError(404, {
          code: "not_found",
          message: "application_not_found",
        });
      }

      assertValidStageTransition(application.stage, input.toStage);

      if (input.toStage === "HIRED") {
        if (!input.proposalId) {
          throw new GovernanceViolation(
            "HIRED transition requires an APPROVED HIRE-class AiDecisionProposal id",
          );
        }
        const proposal = await tx.aiDecisionProposal.findFirst({
          where: { id: input.proposalId, tenantId: auth.tenantId },
        });
        if (!proposal) {
          throw new GovernanceViolation("Proposal not found for tenant");
        }
        if (proposal.status !== "APPROVED") {
          throw new GovernanceViolation(
            `HIRED transition blocked: proposal status is ${proposal.status}; APPROVED is required`,
          );
        }
        if (proposal.proposedActionType !== "HIRE") {
          throw new GovernanceViolation(
            "Authorizing proposal must be of HIRE action type",
          );
        }
        if (proposal.subjectType !== "JobApplication" || proposal.subjectRef !== application.id) {
          throw new GovernanceViolation(
            "Authorizing proposal must reference this JobApplication",
          );
        }
      }

      const updated = await tx.jobApplication.update({
        where: { id: application.id },
        data: {
          stage: input.toStage,
          latestScreeningProposalId: input.proposalId ?? application.latestScreeningProposalId,
          rejectedAt: input.toStage === "REJECTED" ? new Date() : application.rejectedAt,
          hiredAt: input.toStage === "HIRED" ? new Date() : application.hiredAt,
        },
      });

      await appendGovernanceAudit(tx, {
        tenantId: auth.tenantId,
        eventType: `recruiting.application.stage_${input.toStage.toLowerCase()}`,
        actorSubjectId: auth.subjectId,
        entityType: "JobApplication",
        entityId: application.id,
        correlationId: auth.correlationId,
        metadata: {
          fromStage: application.stage,
          toStage: input.toStage,
          proposalId: input.proposalId ?? null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.application.stage_changed",
        correlationId: auth.correlationId,
        payload: {
          applicationId: application.id,
          fromStage: application.stage,
          toStage: input.toStage,
        },
      });

      return updated;
    },
  );
}

export type { Prisma };
