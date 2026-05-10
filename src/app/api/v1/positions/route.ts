import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createPosition } from "@/lib/positions/positions";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  jobRoleId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  parentPositionId: z.string().uuid().nullable().optional(),
  headcount: z.number().int().min(1).max(1000).optional(),
  fteBasisPoints: z.number().int().min(1).max(10000).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("POST", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const body = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const pos = await createPosition(auth, body);
    return jsonV1(
      {
        positionId: pos.id,
        code: pos.code,
        title: pos.title,
        status: pos.status,
        headcount: pos.headcount,
        fteBasisPoints: pos.fteBasisPoints,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
