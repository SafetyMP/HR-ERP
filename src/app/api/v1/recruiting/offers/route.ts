import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { draftOffer } from "@/lib/recruiting/offers";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const DraftOfferSchema = z.object({
  applicationId: z.string().uuid(),
  baseAnnualAmountMinor: z.union([
    z.string().regex(/^\d+$/),
    z.number().int().positive(),
  ]),
  currencyCode: z.string().regex(/^[A-Z]{3}$/),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "ISO 8601 yyyy-mm-dd")
    .nullable()
    .optional(),
  expiresAt: z.string().datetime().nullable().optional(),
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

    const body = DraftOfferSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );

    const offer = await draftOffer(auth, {
      applicationId: body.applicationId,
      baseAnnualAmountMinor: body.baseAnnualAmountMinor,
      currencyCode: body.currencyCode,
      startDate: body.startDate ?? null,
      expiresAt: body.expiresAt ?? null,
    });

    return jsonV1(
      {
        offerId: offer.id,
        applicationId: offer.applicationId,
        status: offer.status,
        currencyCode: offer.currencyCode,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
