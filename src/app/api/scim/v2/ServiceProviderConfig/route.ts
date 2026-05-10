import { NextResponse } from "next/server";

const SCIM_CONTENT_TYPE = "application/scim+json";

export function GET() {
  return NextResponse.json(
    {
      schemas: ["urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig"],
      documentationUri: "https://github.com/SafetyMP/HR-ERP/blob/main/docs/security/scim.md",
      patch: { supported: true },
      bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
      filter: { supported: true, maxResults: 200 },
      changePassword: { supported: false },
      sort: { supported: false },
      etag: { supported: false },
      authenticationSchemes: [
        {
          type: "oauthbearertoken",
          name: "OAuth Bearer Token",
          description: "Long-lived bearer token configured via SCIM_TENANT_TOKENS",
          specUri: "https://datatracker.ietf.org/doc/html/rfc6750",
          documentationUri: "https://github.com/SafetyMP/HR-ERP/blob/main/docs/security/scim.md",
          primary: true,
        },
      ],
      meta: {
        resourceType: "ServiceProviderConfig",
        location: "/api/scim/v2/ServiceProviderConfig",
      },
    },
    { headers: { "content-type": SCIM_CONTENT_TYPE } },
  );
}
