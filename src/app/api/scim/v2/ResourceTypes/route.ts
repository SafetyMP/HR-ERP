import { NextResponse } from "next/server";

const SCIM_CONTENT_TYPE = "application/scim+json";

export function GET() {
  return NextResponse.json(
    [
      {
        schemas: ["urn:ietf:params:scim:schemas:core:2.0:ResourceType"],
        id: "User",
        name: "User",
        endpoint: "/Users",
        description: "Workforce member provisioned via SCIM",
        schema: "urn:ietf:params:scim:schemas:core:2.0:User",
        meta: {
          resourceType: "ResourceType",
          location: "/api/scim/v2/ResourceTypes/User",
        },
      },
    ],
    { headers: { "content-type": SCIM_CONTENT_TYPE } },
  );
}
