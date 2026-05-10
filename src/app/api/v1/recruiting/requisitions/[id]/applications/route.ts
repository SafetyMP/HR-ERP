import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { listApplicationsForRequisition } from "@/lib/recruiting/applications";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const rows = await listApplicationsForRequisition(auth, id);
    return jsonV1(
      {
        requisitionId: id,
        applications: rows.map((row) => ({
          id: row.id,
          stage: row.stage,
          appliedAt: row.appliedAt.toISOString(),
          latestScreeningProposalId: row.latestScreeningProposalId,
          candidate: {
            id: row.candidate.id,
            // Expose name only — auditor_readonly should not see contact details.
            fullName: row.candidate.fullName,
            sourceChannel: row.candidate.sourceChannel,
          },
        })),
      },
      auth.correlationId,
    );
  });
}
