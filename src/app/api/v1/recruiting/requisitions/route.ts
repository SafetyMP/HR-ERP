import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createRequisition,
  listRequisitions,
} from "@/lib/recruiting/requisitions";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateRequisitionSchema = z.object({
  title: z.string().min(1).max(200),
  departmentId: z.string().uuid().nullable().optional(),
  jobRoleId: z.string().uuid().nullable().optional(),
  hiringManagerId: z.string().uuid().nullable().optional(),
  openings: z.number().int().min(1).max(1000).optional(),
  locationCountry: z
    .string()
    .regex(/^[A-Z]{2}$/, "ISO-3166 alpha-2")
    .nullable()
    .optional(),
  employmentType: z
    .enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMP"])
    .optional(),
  description: z.string().max(20000).nullable().optional(),
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

    const body = CreateRequisitionSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const requisition = await createRequisition(auth, body);
    return jsonV1(
      {
        requisitionId: requisition.id,
        status: requisition.status,
        title: requisition.title,
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
    const rows = await listRequisitions(auth, status ? { status } : {});

    return jsonV1(
      {
        requisitions: rows.map((r) => ({
          id: r.id,
          title: r.title,
          status: r.status,
          openings: r.openings,
          employmentType: r.employmentType,
          locationCountry: r.locationCountry,
          updatedAt: r.updatedAt.toISOString(),
        })),
      },
      auth.correlationId,
    );
  });
}
