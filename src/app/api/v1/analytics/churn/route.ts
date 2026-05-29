import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { listChurnScoresForTenant } from "@/lib/analytics/churn";
import { getRoutePolicy } from "@/lib/security/route-policies";

const PATH = "/api/v1/analytics/churn";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const policy = getRoutePolicy("GET", PATH)!;
    const churnScores = await listChurnScoresForTenant(auth, {
      permission: policy.permission,
      abac: policy.abac,
    });
    return { churnScores };
  },
});
