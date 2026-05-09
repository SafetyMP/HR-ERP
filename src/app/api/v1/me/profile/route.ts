import { ApiError } from "@/lib/api/v1/errors";
import { jsonV1, safeRoute } from "@/lib/api/v1/http";
import { getMyProfile } from "@/lib/profile/get-my-profile";
import { patchMyProfileSchema } from "@/lib/profile/patch-my-profile-schema";
import { patchMyProfile } from "@/lib/profile/patch-my-profile";
import { assertAbac, assertPermission } from "@/lib/security/policy-engine";
import { requireBearerAuth } from "@/lib/security/request-auth";
import { getRoutePolicy } from "@/lib/security/route-policies";

export async function GET(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("GET", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    const data = await getMyProfile(auth);
    return jsonV1(data, auth.correlationId);
  });
}

export async function PATCH(request: Request) {
  const auth = await requireBearerAuth(request);
  const pathname = new URL(request.url).pathname;

  return safeRoute(auth.correlationId, async () => {
    const policy = getRoutePolicy("PATCH", pathname);
    if (!policy) {
      throw new ApiError(404, {
        code: "not_found",
        message: "route_policy_missing",
      });
    }
    assertPermission(auth, policy.permission);
    assertAbac(auth, policy.abac, "confidential");

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_profile_update",
      });
    }

    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_profile_update",
      });
    }

    const parsed = patchMyProfileSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ApiError(400, {
        code: "validation_error",
        message: "invalid_profile_update",
      });
    }

    const data = await patchMyProfile(auth, parsed.data);
    return jsonV1(data, auth.correlationId);
  });
}
