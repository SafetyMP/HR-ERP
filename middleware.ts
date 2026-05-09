import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { API_VERSION } from "@/lib/backend/stack-manifest";
import { readOrCreateTraceId } from "@/lib/observability/trace-id-edge";
import { readCorrelationId } from "@/lib/security/correlation-id";
import { verifyHrJwt } from "@/lib/security/jwt";

export async function middleware(request: NextRequest) {
  const correlationId = readCorrelationId(request);
  const traceId = readOrCreateTraceId(request);
  const correlationHeaders = new Headers();
  correlationHeaders.set("x-correlation-id", correlationId);
  correlationHeaders.set("x-trace-id", traceId);

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        apiVersion: API_VERSION,
        error: {
          code: "unauthorized",
          message: "missing_bearer_token",
        },
      },
      { status: 401, headers: correlationHeaders },
    );
  }

  try {
    await verifyHrJwt(authHeader.slice("Bearer ".length).trim());
  } catch {
    return NextResponse.json(
      {
        apiVersion: API_VERSION,
        error: {
          code: "unauthorized",
          message: "invalid_token",
        },
      },
      { status: 401, headers: correlationHeaders },
    );
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  requestHeaders.set("x-trace-id", traceId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
