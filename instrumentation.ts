/**
 * Next.js server bootstrap — runs in the Node.js runtime (not Edge).
 * See `docs/operations/vercel-managed-phase1-environment.md` for OTEL_* variables.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  // Skip during `next build` so OTLP exporters never run while prerendering.
  if (
    process.env.NEXT_PHASE === "phase-production-build" ||
    nextCliIsBuildArgv()
  ) {
    return;
  }

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint?.trim() && process.env.OTEL_ENABLED !== "true") {
    return;
  }

  const { startNodeOtel } = await import("./lib/observability/node-sdk");
  startNodeOtel();
}

/** Heuristic when `NEXT_PHASE` is not set (fallback for `npx next build`). */
function nextCliIsBuildArgv(): boolean {
  const i = process.argv.findIndex(
    (a) =>
      a === "next" ||
      a.endsWith("/next") ||
      a.endsWith("\\next") ||
      a.endsWith("/next.js") ||
      a.endsWith("\\next.js"),
  );
  return i >= 0 && process.argv[i + 1] === "build";
}
