import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getCurrentPaystub } from "@/lib/paystub/get-current-paystub";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/me/paystub/current";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const policy = getRoutePolicy("GET", PATH)!;
    const paystub = await getCurrentPaystub(auth, {
      permission: policy.permission,
      abac: policy.abac,
    });
    return { paystub };
  },
});
