import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getMyProfile } from "@/lib/profile/get-my-profile";
import { patchMyProfile } from "@/lib/profile/patch-my-profile";
import { patchMyProfileSchema } from "@/lib/profile/patch-my-profile-schema";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/me/profile";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const policy = getRoutePolicy("GET", PATH)!;
    return getMyProfile(auth, {
      permission: policy.permission,
      abac: policy.abac,
    });
  },
});

export const PATCH = defineV1Route({
  method: "PATCH",
  pathname: PATH,
  classification: "confidential",
  bodySchema: patchMyProfileSchema,
  handler: async ({ auth, body }) => {
    const policy = getRoutePolicy("PATCH", PATH)!;
    return patchMyProfile(auth, body, {
      permission: policy.permission,
      abac: policy.abac,
    });
  },
});
