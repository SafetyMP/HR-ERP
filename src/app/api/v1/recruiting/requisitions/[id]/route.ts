import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  getRequisition,
  transitionRequisitionStatus,
} from "@/lib/recruiting/requisitions";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PatchSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "ON_HOLD", "CLOSED", "FILLED"]),
});

function serializeRequisition(row: {
  id: string;
  title: string;
  status: string;
  openings: number;
  employmentType: string;
  locationCountry: string | null;
  payRangeMin: unknown;
  payRangeMax: unknown;
  payRangeCurrency: string;
  postingJurisdiction: string | null;
  description: string | null;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    openings: row.openings,
    employmentType: row.employmentType,
    locationCountry: row.locationCountry,
    payRangeMin: row.payRangeMin !== null ? Number(row.payRangeMin) : null,
    payRangeMax: row.payRangeMax !== null ? Number(row.payRangeMax) : null,
    payRangeCurrency: row.payRangeCurrency,
    postingJurisdiction: row.postingJurisdiction,
    description: row.description,
    updatedAt: row.updatedAt.toISOString(),
  };
}

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
    assertAbac(auth, policy.abac, "internal");

    const row = await getRequisition(auth, id);
    return jsonV1(
      { requisition: serializeRequisition(row) },
      auth.correlationId,
    );
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;
  return safeRouteAuth(request, async (auth) => {
    const policy = getRoutePolicy("PATCH", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "internal");

    const body = PatchSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );

    const updated = await transitionRequisitionStatus(auth, id, body.status);
    return jsonV1(
      {
        requisitionId: updated.id,
        status: updated.status,
      },
      auth.correlationId,
    );
  });
}
