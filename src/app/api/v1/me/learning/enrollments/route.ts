import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { listSelfEnrollments } from "@/lib/learning/list-self-enrollments";

const PATH = "/api/v1/me/learning/enrollments";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "internal",
  handler: async ({ auth }) => {
    const enrollments = await listSelfEnrollments(auth);
    return { enrollments };
  },
});
