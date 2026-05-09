import { ApiError } from "@/lib/api/v1/errors";
import type { AuthContext } from "@/lib/security/auth-context";
import { readCorrelationId } from "@/lib/security/correlation-id";
import { claimsToAuthContext, verifyHrJwt } from "@/lib/security/jwt";

export { readCorrelationId } from "@/lib/security/correlation-id";

export async function requireBearerAuth(request: Request): Promise<AuthContext> {
  const correlationId = readCorrelationId(request);
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "missing_bearer_token",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "missing_bearer_token",
    });
  }

  try {
    const claims = await verifyHrJwt(token);
    return claimsToAuthContext(claims, correlationId);
  } catch {
    throw new ApiError(401, {
      code: "unauthorized",
      message: "invalid_token",
    });
  }
}
