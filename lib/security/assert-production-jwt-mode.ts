/**
 * Production must not rely on shared-secret HS256 as the issuer mode.
 * Local/CI may continue using JWT_ISSUER_MODE=hs256 (default).
 */
export function assertProductionJwtIssuerMode(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.VERCEL_ENV === "preview") return;
  if (process.env.ALLOW_HS256_IN_PRODUCTION === "1") return;

  const mode = (process.env.JWT_ISSUER_MODE ?? "hs256").toLowerCase();
  if (mode === "jwks" || mode === "oidc") return;

  throw new Error(
    "JWT_ISSUER_MODE must be jwks or oidc in production (set ALLOW_HS256_IN_PRODUCTION=1 only for explicit break-glass).",
  );
}
