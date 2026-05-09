import type { AiProposalStatus } from "@/app/generated/prisma/client";

import { GovernanceViolation } from "@/lib/governance/errors";

const EDGES: Record<AiProposalStatus, AiProposalStatus[]> = {
  PROPOSED: ["AWAITING_REVIEW", "REJECTED"],
  AWAITING_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["EXECUTED"],
  REJECTED: [],
  EXECUTED: [],
};

export function assertValidProposalTransition(
  from: AiProposalStatus,
  to: AiProposalStatus,
): void {
  const allowed = EDGES[from];
  if (!allowed.includes(to)) {
    throw new GovernanceViolation(
      `Invalid proposal transition: ${from} -> ${to}`,
    );
  }
}
