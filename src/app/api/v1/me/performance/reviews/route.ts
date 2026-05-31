import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { listMyPerformanceReviews } from "@/lib/performance/reviews-v2";

const PATH = "/api/v1/me/performance/reviews";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    return listMyPerformanceReviews(auth);
  },
});
