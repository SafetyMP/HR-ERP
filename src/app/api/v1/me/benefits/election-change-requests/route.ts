import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { createBenefitElectionChangeRequest } from "@/lib/benefits/create-benefit-election-change-request";
import { z } from "zod";

const bodySchema = z.object({
  category: z.enum(["MEDICAL", "DENTAL", "VISION", "INCOME_PROTECTION", "RETIREMENT"]),
  summary: z.string().min(8).max(2000),
});

export const POST = defineV1Route({
  method: "POST",
  pathname: "/api/v1/me/benefits/election-change-requests",
  classification: "confidential",
  bodySchema,
  handler: async ({ auth, body }) => {
    const row = await createBenefitElectionChangeRequest(auth, body);
    return { benefitElectionChangeRequest: row };
  },
});
