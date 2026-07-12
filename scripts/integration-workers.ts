/**
 * Runs BullMQ worker + transactional outbox publisher + demo token refresher.
 * Start alongside `npm run dev` after Postgres + Redis are up.
 *
 * Usage: npm run worker:integrations
 */
import "dotenv/config";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";
import { INTEGRATION_QUEUE_NAME } from "@/lib/integrations/constants";
import { bullConnectionOptionsFromEnv } from "@/lib/integrations/queue/redis-connection";
import {
  IntegrationJobError,
  processIntegrationJob,
} from "@/lib/integrations/workers/integration-job-processor";
import { IntegrationHttpError } from "@/lib/integrations/errors";
import { writeIntegrationDeadLetter } from "@/lib/integrations/dlq/write-dlq";
import { publishPendingOutboxBatch } from "@/lib/integrations/outbox/publish-outbox";
import { processPendingWebhookDeliveries } from "@/lib/webhooks/process-pending-deliveries";
import { refreshExpiringDemoTokens } from "@/lib/integrations/workers/token-refresh";
import { Worker, UnrecoverableError, type Job } from "bullmq";

function isNonRetryable(err: unknown): boolean {
  if (err instanceof IntegrationJobError && err.failureClass === "fatal") {
    return true;
  }
  if (err instanceof IntegrationHttpError && err.class === "fatal") {
    return true;
  }
  return false;
}

const connection = bullConnectionOptionsFromEnv();

const worker = new Worker<IntegrationJobPayload, void, "run">(
  INTEGRATION_QUEUE_NAME,
  async (job: Job<IntegrationJobPayload, void, "run">) => {
    try {
      await processIntegrationJob(job.data);
    } catch (err) {
      if (isNonRetryable(err)) {
        const msg =
          err instanceof Error
            ? err.message
            : "non-retryable integration failure";
        throw new UnrecoverableError(msg);
      }
      throw err;
    }
  },
  {
    connection,
    concurrency: 8,
  },
);

worker.on("failed", async (job, err) => {
  if (!job?.data) return;

  const maxAttempts = job.opts.attempts ?? 1;
  const terminal =
    err instanceof UnrecoverableError || job.attemptsMade >= maxAttempts;

  if (!terminal) return;

  await writeIntegrationDeadLetter({
    tenantId: job.data.tenantId,
    vendorKey: job.data.vendorKey,
    jobType: job.data.jobType,
    payload: job.data,
    failureReason:
      err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    correlationId: job.data.correlationId,
    attempts: job.attemptsMade,
  });

  try {
    await job.remove();
  } catch (removeErr) {
    console.error(
      "[integrations] failed to purge terminal job from Redis",
      removeErr,
    );
  }
});

setInterval(() => {
  publishPendingOutboxBatch().catch((e) => {
    console.error("[outbox]", e);
  });
}, 2000);

setInterval(
  () => {
    processPendingWebhookDeliveries().catch((e) => {
      console.error("[webhooks]", e);
    });
  },
  Number(process.env.WEBHOOK_DELIVERY_POLL_MS ?? "2000"),
);

setInterval(() => {
  refreshExpiringDemoTokens().catch((e) => {
    console.error("[token-refresh]", e);
  });
}, 60_000);

void publishPendingOutboxBatch();
void processPendingWebhookDeliveries();
void refreshExpiringDemoTokens();

console.log(
  `[integrations] Worker listening on "${INTEGRATION_QUEUE_NAME}" (Redis + Postgres required)`,
);
