import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRouteAuth } from "@/lib/api/v1/http";
import { createCourse } from "@/lib/learning/courses";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { getRoutePolicy } from "@/lib/security/route-policies";

const CreateSchema = z.object({
  code: z.string().min(1).max(80),
  title: z.string().min(1).max(200),
  description: z.string().max(8000).nullable().optional(),
  mandatoryDueDays: z.number().int().min(1).max(3650).nullable().optional(),
  estimatedDuration: z.string().max(40).nullable().optional(),
  externalProvider: z.string().max(120).nullable().optional(),
  externalContentRef: z.string().max(500).nullable().optional(),
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
    const course = await createCourse(auth, body);
    return jsonV1(
      {
        courseId: course.id,
        code: course.code,
        title: course.title,
        status: course.status,
      },
      auth.correlationId,
      { status: 201 },
    );
  });
}
