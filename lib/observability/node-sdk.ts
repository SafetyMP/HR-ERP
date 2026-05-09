import { NodeSDK } from "@opentelemetry/sdk-node";

let sdk: NodeSDK | undefined;

/**
 * Starts the OpenTelemetry Node SDK using standard `OTEL_*` env vars
 * (see `docs/operations/vercel-managed-phase1-environment.md`).
 * No-op if neither an OTLP endpoint nor `OTEL_ENABLED=true` is set.
 */
export function startNodeOtel(): void {
  if (sdk) return;

  const endpoint =
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ??
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint?.trim() && process.env.OTEL_ENABLED !== "true") {
    return;
  }

  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME = "hr-erp";
  }

  sdk = new NodeSDK();
  sdk.start();

  process.once("SIGTERM", () => {
    void sdk?.shutdown().catch(() => undefined);
  });
}
