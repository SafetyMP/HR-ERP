import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getBenefitsSummary } from "@/lib/benefits/get-benefits-summary";

const PATH = "/api/v1/me/benefits/summary";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const benefitsSummary = await getBenefitsSummary(auth);
    return { benefitsSummary };
  },
});
