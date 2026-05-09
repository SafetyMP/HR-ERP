import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import {
  createManagerAttendanceCorrection,
  listManagerAttendanceCorrections,
} from "@/lib/attendance/attendance-correction-requests-service";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";
import { z } from "zod";

const postSchema = z.object({
  employeeId: z.string().uuid(),
  punchKind: z.enum(["CLOCK_IN", "CLOCK_OUT"]),
  requestedOccurredAt: z.string(),
  reason: z.string().min(8).max(2000),
});

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

    const rows = await listManagerAttendanceCorrections(auth);
    return jsonV1({ attendanceCorrectionRequests: rows }, auth.correlationId);
  });
}

export async function POST(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "validation_error",
        message: "correction_invalid_body",
      });
    }

    const parsed = postSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "correction_invalid_body",
      });
    }

    const row = await createManagerAttendanceCorrection(auth, parsed.data);
    return jsonV1({ attendanceCorrectionRequest: row }, auth.correlationId);
  });
}
