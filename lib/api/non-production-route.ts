import { NextResponse } from "next/server";

/**
 * Blocks demo/mock-only API routes in production unless explicitly enabled.
 */
export function assertNonProductionDemoApi(feature: string): void {
  if (process.env.NODE_ENV !== "production") return;
  if (process.env.ALLOW_DEMO_API_ROUTES === "1") return;
  throw new DemoApiNotAvailableError(feature);
}

export class DemoApiNotAvailableError extends Error {
  readonly status = 404;

  constructor(feature: string) {
    super(`demo_api_not_available:${feature}`);
    this.name = "DemoApiNotAvailableError";
  }
}

export function demoApiNotAvailableResponse(
  feature: string,
): NextResponse<{ error: string }> {
  return NextResponse.json(
    { error: `demo_api_not_available:${feature}` },
    { status: 404 },
  );
}
