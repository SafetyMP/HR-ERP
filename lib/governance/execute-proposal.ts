import type { HighStakesActionType } from "@/app/generated/prisma/client";

import { executeApprovedProposal } from "@/lib/governance/high-stakes";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export async function runHighStakesExecution(
  auth: AuthContext,
  proposalId: string,
  input: {
    actionKind: HighStakesActionType;
    externalRef?: string | null;
  },
) {
  return withAuthorizedTransaction(
    prisma,
    auth,
    { permission: "governance:ai_execute" },
    (tx) =>
      executeApprovedProposal(tx, {
        tenantId: auth.tenantId,
        proposalId,
        performedBySubjectId: auth.subjectId,
        actionKind: input.actionKind,
        externalRef: input.externalRef ?? null,
        correlationId: auth.correlationId,
      }),
  );
}
