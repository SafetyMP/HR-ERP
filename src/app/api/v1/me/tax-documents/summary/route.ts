import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { listMyTaxDocumentSummaries } from "@/lib/tax-documents/list-tax-documents";

const PATH = "/api/v1/me/tax-documents/summary";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "confidential",
  handler: async ({ auth }) => {
    const taxDocuments = await listMyTaxDocumentSummaries(auth);
    return { taxDocuments };
  },
});
