import { z } from "zod";

import { API_VERSION } from "@/lib/backend/stack-manifest";
import { verifyBearerIssuerSecret } from "@/lib/security/bearer-issuer";
import { signHrAccessToken } from "@/lib/security/jwt";
import { ROLES, type Role } from "@/lib/security/permissions";

/**
 * Mint HR ERP access JWTs for demo / bootstrap (HS256, same verifier as `verifyHrJwt`).
 *
 * Not under `/api/v1` — avoids chicken-and-egg with bearer middleware.
 *
 * Auth: `Authorization: Bearer <HR_ERP_BEARER_ISSUER_SECRET>` (min 32 chars).
 * Never call from the browser with the issuer secret; use server-side or `curl`.
 */
const bodySchema = z.object({
  sub: z.string().min(1).max(200).optional(),
  tenantId: z.string().min(1).max(200).optional(),
  subjectEmployeeId: z.string().min(1).max(200).optional(),
  omitSubjectEmployeeId: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  expiresInSeconds: z.number().int().min(300).max(7200).optional(),
});

export async function POST(request: Request) {
  const issuerSecret = process.env.HR_ERP_BEARER_ISSUER_SECRET;
  if (!issuerSecret || issuerSecret.length < 32) {
    return Response.json(
      {
        apiVersion: API_VERSION,
        error: {
          code: "service_unavailable",
          message: "token_issuer_not_configured",
        },
      },
      { status: 503 },
    );
  }

  const authz = request.headers.get("authorization");
  if (!verifyBearerIssuerSecret(authz, issuerSecret)) {
    return Response.json(
      {
        apiVersion: API_VERSION,
        error: {
          code: "unauthorized",
          message: "invalid_issuer_credentials",
        },
      },
      { status: 401 },
    );
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json().catch(() => ({}));
    body = bodySchema.parse(json);
  } catch {
    return Response.json(
      {
        apiVersion: API_VERSION,
        error: { code: "bad_request", message: "invalid_body" },
      },
      { status: 400 },
    );
  }

  const tenantId =
    body.tenantId?.trim() ||
    process.env.DEMO_TENANT_ID?.trim() ||
    "default-tenant";
  const sub =
    body.sub?.trim() || "22222222-2222-2222-2222-222222222222";

  let subjectEmployeeId: string | undefined;
  if (body.omitSubjectEmployeeId) {
    subjectEmployeeId = undefined;
  } else {
    subjectEmployeeId =
      body.subjectEmployeeId?.trim() ||
      process.env.DEMO_PAYSTUB_EMPLOYEE_ID?.trim() ||
      "b0000001-0001-4000-8000-000000000011";
  }

  const roleStrings = body.roles?.length ? body.roles : ["employee"];
  const roles = roleStrings.filter((r): r is Role =>
    (ROLES as readonly string[]).includes(r as string),
  );
  if (roles.length === 0) {
    return Response.json(
      {
        apiVersion: API_VERSION,
        error: { code: "bad_request", message: "no_valid_roles" },
      },
      { status: 400 },
    );
  }

  const expiresInSeconds = body.expiresInSeconds ?? 3600;
  const access_token = await signHrAccessToken({
    sub,
    tenantId,
    roles,
    subjectEmployeeId,
    mfaLevel: "standard",
    expiresIn: `${expiresInSeconds}s`,
  });

  return Response.json({
    apiVersion: API_VERSION,
    access_token,
    token_type: "Bearer",
    expires_in: expiresInSeconds,
  });
}
