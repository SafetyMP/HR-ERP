import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getPtoSummary } from "@/lib/pto/get-pto-summary";

const PATH = "/api/v1/me/pto/summary";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const ptoSummary = await getPtoSummary(auth);
    return { ptoSummary };
  },
});
