import { z } from "zod";

import { assertTrackDApiAllowed } from "@/lib/api/v1/track-d-guard";
import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createWorkflowDefinition } from "@/lib/workflow/engine";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  kind: z.enum([
    "TIME_OFF_APPROVAL",
    "COMPENSATION_CHANGE",
    "POSITION_CHANGE",
    "TERMINATION",
    "CUSTOM",
    "COBRA_ELECTION",
    "ONBOARDING",
    "OFFBOARDING",
  ]),
  code: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  steps: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        approverRoles: z.array(z.string().min(1)).min(1).max(10),
        slaHours: z.number().int().min(1).max(720).optional(),
      }),
    )
    .min(1)
    .max(10),
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
    assertAbac(auth, policy.abac, "internal");

    const body = CreateSchema.parse(
      (await request.json().catch(() => null)) ?? {},
    );
    const def = await createWorkflowDefinition(auth, body);
    return jsonV1(
      {
        definitionId: def.id,
        kind: def.kind,
        code: def.code,
        name: def.name,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
