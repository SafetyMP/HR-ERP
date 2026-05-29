import { parseSessionTokenFromCookieHeader } from "@/lib/auth/session-cookie";
import { ApiError } from "@/lib/api/v1/errors";
import type { AuthContext } from "@/lib/security/auth-context";
import { readCorrelationId } from "@/lib/security/correlation-id";
import { claimsToAuthContext, verifyHrJwt } from "@/lib/security/jwt";

export { readCorrelationId } from "@/lib/security/correlation-id";

function readAccessTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) return token;
  }
  return parseSessionTokenFromCookieHeader(request.headers.get("cookie"));
}

export async function requireBearerAuth(request: Request): Promise<AuthContext> {
  const correlationId = readCorrelationId(request);
  const authorization = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authorization?.startsWith("Bearer ") &&
    process.env.ALLOW_PRODUCTION_BEARER !== "1"
  ) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "bearer_not_allowed_in_production",
    });
  }

  const token = readAccessTokenFromRequest(request);

  if (!token) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "missing_bearer_token",
    });
  }

  try {
    const claims = await verifyHrJwt(token);
    return claimsToAuthContext(claims, correlationId);
  } catch (err) {
    // Server-side observability for the previously opaque `invalid_token` 401.
    // Logs the actual `jose` error class (e.g. `JWSSignatureVerificationFailed`,
    // `JWTExpired`, `JWTClaimValidationFailed`) so production failures can be
    // diagnosed without code-side guessing. Token + secret material are NEVER
    // logged. Client response stays the generic `invalid_token` to avoid
    // leaking which check failed.
    const e = err as { name?: string; code?: string; message?: string };
    console.error(
      JSON.stringify({
        level: "error",
        msg: "jwt_verify_failed",
        jose_error_name: e?.name ?? "Unknown",
        jose_error_code: e?.code ?? null,
        jose_error_message: e?.message ?? null,
        correlation_id: correlationId,
      }),
    );
    throw new ApiError(401, {
      code: "unauthorized",
      message: "invalid_token",
    });
  }
}
