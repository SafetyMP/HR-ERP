import { z } from "zod";

import { GovernanceViolation } from "@/lib/governance/errors";
import { runHighStakesExecution } from "@/lib/governance/execute-proposal";
import { getGovernanceAuth } from "@/lib/governance/request-auth";
import { AuthorizationError } from "@/lib/security/policy-engine";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

const executeBodySchema = z.object({
  actionKind: z.enum([
    "HIRE",
    "TERMINATION",
    "COMPENSATION_CHANGE",
    "PIP_INITIATION",
    "OTHER",
  ]),
  externalRef: z.string().optional().nullable(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getGovernanceAuth(request);
    if (!auth.tenantId || !auth.subjectId) {
      return jsonError("tenantId and subjectId required", 400);
    }

    const { id } = await context.params;
    const body = executeBodySchema.parse(await request.json());
    const result = await runHighStakesExecution(auth, id, body);

    return Response.json({
      actionId: result.actionId,
      proposalId: id,
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
