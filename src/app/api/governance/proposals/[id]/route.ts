import { z } from "zod";

import { GovernanceViolation } from "@/lib/governance/errors";
import { transitionDecisionProposal } from "@/lib/governance/proposals";
import { getGovernanceAuth } from "@/lib/governance/request-auth";
import { AuthorizationError } from "@/lib/security/policy-engine";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

const patchBodySchema = z.object({
  action: z.enum(["submit_for_review", "approve", "reject"]),
  reviewNotes: z.string().optional().nullable(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getGovernanceAuth(request);
    if (!auth.tenantId || !auth.subjectId) {
      return jsonError("tenantId and subjectId required", 400);
    }

    const { id } = await context.params;
    const body = patchBodySchema.parse(await request.json());

    const updated = await transitionDecisionProposal(
      auth,
      id,
      body.action,
      body.reviewNotes,
    );

    return Response.json({
      proposalId: updated.id,
      status: updated.status,
    });
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
