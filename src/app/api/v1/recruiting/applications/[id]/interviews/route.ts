import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import {
  createJobInterview,
  listJobInterviews,
} from "@/lib/recruiting/job-interviews";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PostSchema = z.object({
  scheduledAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  interviewType: z.string().min(1).max(120),
});

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
    assertAbac(auth, policy.abac, "confidential");
    const interviews = await listJobInterviews(auth, id);
    return jsonV1({ interviews }, auth.correlationId);
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const pathname = new URL(request.url).pathname;
  const { id } = await context.params;

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
    const body = PostSchema.parse(await request.json().catch(() => ({})));
    const interview = await createJobInterview(auth, id, body);
    return jsonV1(interview, auth.correlationId, { status: 201 });
  });
}
