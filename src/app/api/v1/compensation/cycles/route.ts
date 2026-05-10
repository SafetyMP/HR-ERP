import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createCompensationCycle,
  listCompensationCycles,
} from "@/lib/compensation/cycles";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  name: z.string().min(1).max(200),
  cycleType: z.enum(["MERIT", "BONUS", "EQUITY_GRANT"]),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
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
    assertAbac(auth, policy.abac, "confidential");

    const body = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const cycle = await createCompensationCycle(auth, body);
    return jsonV1(
      {
        cycleId: cycle.id,
        name: cycle.name,
        cycleType: cycle.cycleType,
        status: cycle.status,
        currencyCode: cycle.currencyCode,
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
    assertAbac(auth, policy.abac, "confidential");

    const status = url.searchParams.get("status") ?? undefined;
    const rows = await listCompensationCycles(auth, status ? { status } : {});
    return jsonV1(
      {
        cycles: rows.map((c) => ({
          id: c.id,
          name: c.name,
          cycleType: c.cycleType,
          status: c.status,
          effectiveDate: c.effectiveDate.toISOString().slice(0, 10),
          currencyCode: c.currencyCode,
        })),
      },
      auth.correlationId,
    );
  });
}
