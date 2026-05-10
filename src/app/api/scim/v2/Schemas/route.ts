import { NextResponse } from "next/server";

const SCIM_CONTENT_TYPE = "application/scim+json";

export function GET() {
  return NextResponse.json(
    [
      {
        id: "urn:ietf:params:scim:schemas:core:2.0:User",
        name: "User",
        description: "User Account",
        attributes: [
          {
            name: "userName",
            type: "string",
            required: true,
            uniqueness: "server",
            mutability: "readWrite",
          },
          {
            name: "name",
            type: "complex",
            required: false,
            mutability: "readWrite",
            subAttributes: [
              { name: "givenName", type: "string" },
              { name: "familyName", type: "string" },
              { name: "formatted", type: "string" },
            ],
          },
          {
            name: "emails",
            type: "complex",
            multiValued: true,
            required: false,
            subAttributes: [
              { name: "value", type: "string" },
              { name: "primary", type: "boolean" },
              { name: "type", type: "string" },
            ],
          },
          { name: "active", type: "boolean", required: false },
        ],
        meta: {
          resourceType: "Schema",
          location: "/api/scim/v2/Schemas/urn:ietf:params:scim:schemas:core:2.0:User",
        },
      },
    ],
    { headers: { "content-type": SCIM_CONTENT_TYPE } },
  );
}
