import { ApiError } from "@/lib/api/v1/errors";
import { GovernanceViolation } from "@/lib/governance/errors";
import { enqueueEvent } from "@/lib/outbox/enqueue-event";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export interface DraftOfferInput {
  applicationId: string;
  baseAnnualAmountMinor: bigint | string | number;
  currencyCode: string;
  startDate?: string | null;
  expiresAt?: string | null;
}

function normalizeMinor(value: bigint | string | number): bigint {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Math.floor(value) !== value) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "baseAnnualAmountMinor must be an integer",
      });
    }
    return BigInt(value);
  }
  if (!/^-?\d+$/.test(value)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "baseAnnualAmountMinor must be an integer string",
    });
  }
  return BigInt(value);
}

export async function draftOffer(auth: AuthContext, input: DraftOfferInput) {
  const minor = normalizeMinor(input.baseAnnualAmountMinor);
  if (minor <= 0n) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "baseAnnualAmountMinor must be positive",
    });
  }
  if (!/^[A-Z]{3}$/.test(input.currencyCode)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "currencyCode must be ISO 4217 ALPHA-3",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:offer_write",
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
      if (application.stage !== "INTERVIEW" && application.stage !== "OFFER") {
        throw new ApiError(409, {
          code: "stage_invalid_for_offer",
          message: `cannot draft offer when application is in ${application.stage} stage`,
        });
      }

      const offer = await tx.jobOffer.create({
        data: {
          tenantId: auth.tenantId,
          applicationId: application.id,
          status: "PENDING_HITL_APPROVAL",
          baseAnnualAmountMinor: minor,
          currencyCode: input.currencyCode.toUpperCase(),
          startDate: input.startDate ? new Date(input.startDate) : null,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.offer.drafted",
        correlationId: auth.correlationId,
        payload: {
          offerId: offer.id,
          applicationId: application.id,
          status: offer.status,
          currencyCode: offer.currencyCode,
        },
      });

      return offer;
    },
  );
}

export async function extendOffer(
  auth: AuthContext,
  offerId: string,
  authorizingProposalId: string,
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:offer_write",
      resourceClassification: "confidential",
    },
    async (tx) => {
      const offer = await tx.jobOffer.findFirst({
        where: { id: offerId, tenantId: auth.tenantId },
        include: { application: true },
      });
      if (!offer) {
        throw new ApiError(404, {
          code: "not_found",
          message: "offer_not_found",
        });
      }
      if (offer.status !== "PENDING_HITL_APPROVAL") {
        throw new ApiError(409, {
          code: "offer_state_invalid",
          message: `offer must be PENDING_HITL_APPROVAL (current: ${offer.status})`,
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
          `Offer extension blocked: proposal status is ${proposal.status}; APPROVED is required`,
        );
      }
      if (proposal.proposedActionType !== "HIRE") {
        throw new GovernanceViolation(
          "Authorizing proposal must be HIRE-class for an offer",
        );
      }
      if (
        proposal.subjectType !== "JobApplication" ||
        proposal.subjectRef !== offer.applicationId
      ) {
        throw new GovernanceViolation(
          "Authorizing proposal must reference this JobApplication",
        );
      }

      const updated = await tx.jobOffer.update({
        where: { id: offer.id },
        data: {
          status: "EXTENDED",
          authorizingProposalId,
        },
      });

      await tx.jobApplication.update({
        where: { id: offer.applicationId },
        data: { stage: "OFFER" },
      });

      await enqueueEvent(tx, {
        tenantId: auth.tenantId,
        category: "domain.recruiting",
        eventType: "recruiting.offer.extended",
        correlationId: auth.correlationId,
        payload: {
          offerId: offer.id,
          applicationId: offer.applicationId,
          authorizingProposalId,
        },
      });

      return updated;
    },
  );
}
