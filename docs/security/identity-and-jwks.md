# Identity, JWT verification, and JWKS

The HR ERP supports two JWT verification modes. **Production deployments must use
`jwks` mode**; `hs256` exists for local dev and CI fixture tokens only.

## Mode selection

| Env var | Effect |
| --- | --- |
| `JWT_ISSUER_MODE=hs256` (default) | Verify with `JWT_SECRET` (HS256 only) |
| `JWT_ISSUER_MODE=jwks` | Verify with the JSON Web Key Set at `JWT_JWKS_URI` |
| `JWT_ISSUER_MODE=oidc` | Synonym of `jwks`; populate `JWT_JWKS_URI` from `lib/security/oidc-discovery.ts` |

Common companion variables when running in `jwks` mode:

| Env var | Notes |
| --- | --- |
| `JWT_JWKS_URI` | Required. JWKS endpoint of the IdP (Auth0, WorkOS, Okta, Entra, Keycloak, …) |
| `JWT_ISSUER` | Optional. If set, jose enforces `iss` match. |
| `JWT_AUDIENCE` | Optional. If set, jose enforces `aud` match. |
| `JWT_ACCEPTED_ALGS` | Comma-separated. Defaults to `RS256`. Supports `RS256/384/512`, `ES256/384/512`, `PS256/384/512`. |

## Required claim shape

The verified token must surface the following claims (additional ones are ignored):

| Claim | Type | Purpose |
| --- | --- | --- |
| `sub` | string | Stable subject ID — flows into `auth.subjectId` |
| `tenant_id` | string | Tenant root — flows into `auth.tenantId` and is set as `app.tenant_id` for RLS |
| `roles` | string[] | Subset of `lib/security/permissions.ts` `ROLES` |
| `subject_employee_id` | string? | Required for self-service routes |
| `manager_employee_id` | string? | Used by manager routes |
| `org_unit_id` | string? | Optional ABAC scope hint |
| `mfa_level` | "none" \| "standard" \| "step_up" | Required to pass elevated ABAC gates |

If your IdP cannot mint custom claims, run a small token-mapper service that exchanges
its access token for a HR-ERP-shaped JWT signed by an issuer in `JWT_JWKS_URI`.

## Discovery

`lib/security/oidc-discovery.ts` resolves `${issuer}/.well-known/openid-configuration`
and returns the `jwks_uri`, `authorization_endpoint`, and `token_endpoint`. Cache TTL
defaults to 10 minutes; override via `OIDC_DISCOVERY_TTL_MS`.

A typical bootstrap flow:

1. Set `OIDC_ISSUER` for your IdP.
2. On startup, call `fetchOidcDiscoveryDocument(process.env.OIDC_ISSUER!)`.
3. Set `JWT_JWKS_URI` from the document and `JWT_ISSUER_MODE=jwks`.

## Migration from HS256

1. Stand up an external IdP (Auth0, WorkOS, Okta, Entra, Keycloak) and configure it to
   issue tokens with the claim shape above.
2. Deploy a token-mapper if needed.
3. Set `JWT_JWKS_URI`, `JWT_ISSUER`, `JWT_AUDIENCE`, and flip
   `JWT_ISSUER_MODE=jwks`.
4. Remove `JWT_SECRET` from the deployment.
5. The dev script `scripts/issue-dev-jwt.mjs` continues to mint HS256 tokens for local
   development; it is incompatible with `jwks` mode.

## Production hardening

- Never set `ALLOW_DEV_GOVERNANCE_HEADERS` outside development. The runtime now refuses
  the dev header path when `NODE_ENV=production` or `VERCEL_ENV=production`
  (see `lib/governance/request-auth.ts`).
- Pin the IdP behind a stable `JWT_ISSUER` and `JWT_AUDIENCE`.
- Set `JWT_ACCEPTED_ALGS` to the smallest list your IdP actually uses (avoid `none`,
  always asymmetric).
- Rotate signing keys on the IdP side; the JWKS cache TTL of 30 seconds (cooldown)
  ensures hot rotation without redeploys.
