import { z } from "zod";

import { HighStakesActionType as HighStakesActionTypeEnum } from "@/app/generated/prisma/enums";
import { GovernanceViolation } from "@/lib/governance/errors";
import type { CreateProposalInput } from "@/lib/governance/proposals";
import { createDecisionProposal } from "@/lib/governance/proposals";
import { getGovernanceAuth } from "@/lib/governance/request-auth";
import { AuthorizationError } from "@/lib/security/policy-engine";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

const createBodySchema = z.object({
  featureKey: z.string().min(1),
  subjectType: z.string().min(1),
  subjectRef: z.string().min(1),
  proposedActionType: z.nativeEnum(HighStakesActionTypeEnum),
  modelVersion: z.string().optional().nullable(),
  datasetSnapshotId: z.string().optional().nullable(),
  explanation: z.unknown(),
});

export async function POST(request: Request) {
  try {
    const auth = await getGovernanceAuth(request);
    if (!auth.tenantId || !auth.subjectId) {
      return jsonError("tenantId and subjectId required", 400);
    }

    const body = createBodySchema.parse(await request.json()) as CreateProposalInput;
    const proposal = await createDecisionProposal(auth, body);
    return Response.json({ proposalId: proposal.id, status: proposal.status });
  } catch (e) {
    if (e instanceof AuthorizationError) {
      return jsonError("Forbidden", 403);
    }
    if (e instanceof GovernanceViolation) {
      return jsonError(e.message, 409);
    }
    if (e instanceof z.ZodError) {
      return jsonError(e.issues.map((i) => i.message).join("; "), 400);
    }
    if (e instanceof Error && e.message.includes("Unauthorized")) {
      return jsonError("Unauthorized", 401);
    }
    if (e instanceof Error && e.message.includes("JWT")) {
      return jsonError("Unauthorized", 401);
    }
    throw e;
  }
}
