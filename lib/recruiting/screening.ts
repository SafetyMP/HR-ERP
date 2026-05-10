import { ApiError } from "@/lib/api/v1/errors";
import { createDecisionProposal } from "@/lib/governance/proposals";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

import { redactCandidateText } from "./redact";

export interface ProposeScreeningInput {
  applicationId: string;
  /** Recruiter-provided rationale; will be redacted prior to persistence. */
  rationale: string;
  /** Optional model identifier (informational; HITL gate is the merge bar). */
  modelVersion?: string | null;
  factors?: Array<{
    label: string;
    direction: "increases_score" | "decreases_score" | "neutral";
    detail?: string;
  }>;
}

/**
 * Persist an AI screening **proposal** for a job application. The actual
 * stage advance to HIRED still requires HITL approval — this function
 * never mutates the application stage. See ADR ai-governance + the
 * `governance:ai_propose` permission contract.
 */
export async function proposeApplicationScreening(
  auth: AuthContext,
  input: ProposeScreeningInput,
) {
  const application = await withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_read",
      resourceClassification: "confidential",
    },
    async (tx) =>
      tx.jobApplication.findFirst({
        where: { id: input.applicationId, tenantId: auth.tenantId },
        select: { id: true, requisitionId: true, candidateId: true },
      }),
  );

  if (!application) {
    throw new ApiError(404, {
      code: "not_found",
      message: "application_not_found",
    });
  }

  const factors =
    input.factors && input.factors.length > 0
      ? input.factors
      : [
          {
            label: "recruiter_review",
            direction: "neutral" as const,
            detail: "manual recruiter screening (no model factors supplied)",
          },
        ];

  const proposal = await createDecisionProposal(auth, {
    featureKey: "recruiting.application.screening",
    subjectType: "JobApplication",
    subjectRef: application.id,
    proposedActionType: "HIRE",
    modelVersion: input.modelVersion ?? null,
    explanation: {
      summary: redactCandidateText(input.rationale).slice(0, 4000) ||
        "Recruiter advanced application without supplying a free-text rationale.",
      topFactors: factors.slice(0, 20).map((f) => ({
        label: f.label,
        direction: f.direction,
        detail: f.detail
          ? redactCandidateText(f.detail).slice(0, 500)
          : undefined,
      })),
      modelVersion: input.modelVersion ?? undefined,
    },
  });

  await withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "recruiting:application_write",
      resourceClassification: "confidential",
    },
    async (tx) =>
      tx.jobApplication.update({
        where: { id: application.id },
        data: { latestScreeningProposalId: proposal.id },
      }),
  );

  return { proposalId: proposal.id, applicationId: application.id };
}
