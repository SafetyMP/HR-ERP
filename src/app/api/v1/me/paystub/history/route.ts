import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getPaystubHistory } from "@/lib/paystub/get-paystub-history";

const PATH = "/api/v1/me/paystub/history";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const paystubHistory = await getPaystubHistory(auth);
    return { paystubHistory };
  },
});
