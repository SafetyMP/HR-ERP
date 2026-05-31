import { z } from "zod";

import { assertTrackDApiAllowed } from "@/lib/api/v1/track-d-guard";
import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createRecommendation } from "@/lib/compensation/recommendations";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const integerStringOrNumber = z.union([
  z.string().regex(/^-?\d+$/),
  z.number().int(),
]);

const CreateSchema = z.object({
  cycleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  baseIncreaseAmountMinor: integerStringOrNumber.nullable().optional(),
  bonusAmountMinor: integerStringOrNumber.nullable().optional(),
  equityGrantShares: integerStringOrNumber.nullable().optional(),
  justification: z.string().max(8000).nullable().optional(),
});

export async function POST(request: Request) {
  assertTrackDApiAllowed();
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

    const parsed = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );

    const toBigIntInput = (
      v: number | string | null | undefined,
    ): bigint | string | null | undefined => {
      if (v === undefined) return undefined;
      if (v === null) return null;
      return typeof v === "number" ? BigInt(v) : v;
    };

    const rec = await createRecommendation(auth, {
      cycleId: parsed.cycleId,
      employeeId: parsed.employeeId,
      baseIncreaseAmountMinor: toBigIntInput(parsed.baseIncreaseAmountMinor),
      bonusAmountMinor: toBigIntInput(parsed.bonusAmountMinor),
      equityGrantShares: toBigIntInput(parsed.equityGrantShares),
      justification: parsed.justification ?? null,
    });

    return jsonV1(
      {
        recommendationId: rec.id,
        cycleId: rec.cycleId,
        employeeId: rec.employeeId,
        status: rec.status,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
