import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { getTodayAttendanceSummary } from "@/lib/attendance/get-today-attendance-summary";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const summary = await getTodayAttendanceSummary(auth);
    return jsonV1({ todayAttendance: summary }, auth.correlationId);
  });
}
