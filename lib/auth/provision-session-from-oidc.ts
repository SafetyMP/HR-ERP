import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/security/permissions";
import { ROLES } from "@/lib/security/permissions";
import { signHrAccessToken } from "@/lib/security/jwt";
import { verifyHrJwt } from "@/lib/security/jwt";

/**
 * Returns an HR-shaped access JWT suitable for the session cookie.
 * If the IdP token already carries HR claims (`tenant_id`, `roles`), reuse it.
 * Otherwise map `email` → `UserAccount` and mint a session token.
 */
export async function accessTokenForOidcLogin(
  idTokenOrAccessToken: string,
): Promise<string> {
  try {
    const claims = await verifyHrJwt(idTokenOrAccessToken);
    if (claims.tenant_id && claims.roles?.length) {
      return idTokenOrAccessToken;
    }
  } catch {
    // Fall through to email provisioning when IdP token is not HR-shaped.
  }

  const parts = idTokenOrAccessToken.split(".");
  if (parts.length < 2) {
    throw new Error("oidc_token_unusable");
  }
  const payloadJson = Buffer.from(parts[1]!, "base64url").toString("utf8");
  const payload = JSON.parse(payloadJson) as {
    email?: string;
    sub?: string;
  };
  const email = payload.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("oidc_missing_email_claim");
  }

  const account = await prisma.userAccount.findFirst({
    where: { email },
    include: { roles: true },
  });
  if (!account) {
    throw new Error("oidc_user_not_provisioned");
  }

  const roles = account.roles
    .map((r) => r.role)
    .filter((r): r is Role => (ROLES as readonly string[]).includes(r));

  if (roles.length === 0) {
    throw new Error("oidc_user_no_roles");
  }

  return signHrAccessToken({
    sub: account.id,
    tenantId: account.tenantId,
    roles,
    subjectEmployeeId: account.employeeId ?? undefined,
    expiresIn: "8h",
  });
}
