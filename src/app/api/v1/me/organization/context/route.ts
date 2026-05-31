import { defineV1Route } from "@/lib/api/v1/define-v1-route";
import { getMyOrganizationContext } from "@/lib/org/get-organization-context";

const PATH = "/api/v1/me/organization/context";

export const GET = defineV1Route({
  method: "GET",
  pathname: PATH,
  classification: "internal",
  handler: async ({ auth }) => {
    const organizationContext = await getMyOrganizationContext(auth);
    return { organizationContext };
  },
});
