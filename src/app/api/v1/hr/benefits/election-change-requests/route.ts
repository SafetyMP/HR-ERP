import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { listHrBenefitElectionChangeRequests } from "@/lib/benefits/list-hr-benefit-election-change-requests";

export const GET = defineV1Route({
  method: "GET",
  pathname: "/api/v1/hr/benefits/election-change-requests",
  classification: "confidential",
  handler: async ({ auth }) => {
    const requests = await listHrBenefitElectionChangeRequests(auth);
    return { requests };
  },
});
