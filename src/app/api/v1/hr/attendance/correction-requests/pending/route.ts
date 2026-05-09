import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { listPendingAttendanceCorrectionsForHr } from "@/lib/attendance/attendance-correction-requests-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(request: Request) {
  const pathname = new URL(request.url).pathname;

  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const rows = await listPendingAttendanceCorrectionsForHr(auth);
    return jsonV1({ attendanceCorrectionRequestsPending: rows }, auth.correlationId);
  });
}
