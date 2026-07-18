/**
 * Next.js server bootstrap — runs in the Node.js runtime (not Edge).
 * See `docs/operations/vercel-managed-phase1-environment.md` for OTEL_* variables.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  // Skip during `next build` so OTLP exporters never run while prerendering.
  // Use NEXT_PHASE only — avoid process.argv here (Next flags it for Edge analysis).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const { assertProductionJwtIssuerMode } = await import(
    "./lib/security/assert-production-jwt-mode"
  );
  assertProductionJwtIssuerMode();

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint?.trim() && process.env.OTEL_ENABLED !== "true") {
    return;
  }

  const { startNodeOtel } = await import("./lib/observability/node-sdk");
  startNodeOtel();
}
