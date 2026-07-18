import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/security/permissions";
import { ROLES } from "@/lib/security/permissions";
import { signHrAccessToken } from "@/lib/security/jwt";
import { verifyHrJwt } from "@/lib/security/jwt";
import { fetchOidcDiscoveryDocument } from "@/lib/security/oidc-discovery";

/** Map a known login email to an HR access JWT (tenant + roles from `UserAccount`). */
export async function provisionHrSessionFromEmail(
  emailRaw: string,
): Promise<string> {
  const email = emailRaw.trim().toLowerCase();
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

export type OidcLoginOptions = {
  /** Access token for IdP userinfo (preferred when IdP token is not HR-shaped). */
  accessToken?: string;
};

/**
 * Returns an HR-shaped access JWT suitable for the session cookie.
 * If the IdP token already carries HR claims (`tenant_id`, `roles`), reuse it.
 * Otherwise resolve email via verified userinfo (or JWKS-verified token) and mint.
 */
export async function accessTokenForOidcLogin(
  idTokenOrAccessToken: string,
  options?: OidcLoginOptions,
): Promise<string> {
  try {
    const claims = await verifyHrJwt(idTokenOrAccessToken);
    if (claims.tenant_id && claims.roles?.length) {
      return idTokenOrAccessToken;
    }
    const emailFromClaims =
      typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
    if (emailFromClaims) {
      return provisionHrSessionFromEmail(emailFromClaims);
    }
  } catch {
    // Fall through to userinfo provisioning when token is not HR-verifiable.
  }

  const bearer = options?.accessToken?.trim() || idTokenOrAccessToken;
  const email = await resolveEmailFromUserinfo(bearer);
  return provisionHrSessionFromEmail(email);
}

async function resolveEmailFromUserinfo(accessToken: string): Promise<string> {
  const issuer = (process.env.OIDC_ISSUER ?? process.env.JWT_ISSUER ?? "").trim();
  if (!issuer) {
    throw new Error("oidc_issuer_required_for_userinfo");
  }

  const discovery = await fetchOidcDiscoveryDocument(issuer);
  const userinfo = discovery.userinfo_endpoint?.trim();
  if (!userinfo) {
    throw new Error("oidc_userinfo_endpoint_missing");
  }

  const res = await fetch(userinfo, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    throw new Error(`oidc_userinfo_failed_${res.status}`);
  }

  const body = (await res.json()) as { email?: string; preferred_username?: string };
  const email = (body.email ?? body.preferred_username ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("oidc_missing_email_claim");
  }
  return email;
}
