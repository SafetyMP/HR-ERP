/** Top-5 ESS read paths — p95 budget 300ms per docs/architecture/slo-and-load-gates.md */
export const ESS_ME_READ_PATHS = new Set([
  "/api/v1/me/paystub/current",
  "/api/v1/me/benefits/summary",
  "/api/v1/me/pto/summary",
  "/api/v1/me/attendance/today",
  "/api/v1/me/profile",
]);

const ESS_READ_P95_MS = Number(process.env.ESS_API_P95_BUDGET_MS ?? 300);

export function logEssRouteTiming(
  pathname: string,
  durationMs: number,
  correlationId: string,
): void {
  if (!ESS_ME_READ_PATHS.has(pathname)) return;

  const payload = {
    scope: "ess_api_timing",
    pathname,
    durationMs: Math.round(durationMs),
    correlationId,
    budgetMs: ESS_READ_P95_MS,
    slow: durationMs > ESS_READ_P95_MS,
  };

  if (durationMs > ESS_READ_P95_MS) {
    console.warn(JSON.stringify(payload));
  } else if (process.env.ESS_API_TIMING_LOG === "1") {
    console.info(JSON.stringify(payload));
  }
}
