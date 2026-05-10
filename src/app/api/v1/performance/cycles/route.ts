import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createPerformanceCycle,
  listPerformanceCycles,
} from "@/lib/performance/cycles";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ratingScaleMax: z.number().int().min(3).max(7).optional(),
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
    const cycle = await createPerformanceCycle(auth, body);
    return jsonV1(
      {
        cycleId: cycle.id,
        name: cycle.name,
        status: cycle.status,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("GET", url.pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const status = url.searchParams.get("status") ?? undefined;
    const rows = await listPerformanceCycles(auth, status ? { status } : {});
    return jsonV1(
      {
        cycles: rows.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          startDate: c.startDate.toISOString().slice(0, 10),
          endDate: c.endDate.toISOString().slice(0, 10),
          ratingScaleMax: c.ratingScaleMax,
        })),
      },
      auth.correlationId,
    );
  });
}
