import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  generateFilingArtifact,
  getLatestFilingArtifact,
} from "@/lib/payroll/payroll-filing-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(
  request: Request,
  context: { params: Promise<{ periodId: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { periodId } = await context.params;

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

    const artifact = await getLatestFilingArtifact(auth, periodId);
    if (!artifact) {
      throw new ApiError(404, {
        code: "not_found",
        message: "filing_artifact_not_found",
      });
    }
    return jsonV1(artifact, auth.correlationId);
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ periodId: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { periodId } = await context.params;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const artifact = await generateFilingArtifact(auth, periodId);
    return jsonV1(artifact, auth.correlationId, { status: 201 });
  });
}
