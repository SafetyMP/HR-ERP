import { Queue } from "bullmq";
import { INTEGRATION_QUEUE_NAME } from "@/lib/integrations/constants";
import { bullConnectionOptionsFromEnv } from "@/lib/integrations/queue/redis-connection";
import type { IntegrationJobPayload } from "@/lib/integrations/workers/integration-job-processor";

let queue: Queue<IntegrationJobPayload, void, "run"> | undefined;

export function getIntegrationQueue(): Queue<
  IntegrationJobPayload,
  void,
  "run"
> {
  if (queue) return queue;
  queue = new Queue<IntegrationJobPayload, void, "run">(
    INTEGRATION_QUEUE_NAME,
    {
      connection: bullConnectionOptionsFromEnv(),
      defaultJobOptions: {
        attempts: 6,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: { count: 1000 },
        // Drop failed jobs after DLQ persistence — payloads may reference PII-bearing artifacts.
        removeOnFail: { count: 200 },
      },
    },
  );
  return queue;
}

/** Enqueue directly (e.g. DLQ replay) — prefers `jobId` for idempotency. */
export async function enqueueIntegrationJob(
  payload: IntegrationJobPayload,
  jobId?: string,
): Promise<void> {
  const q = getIntegrationQueue();
  await q.add("run", payload, jobId ? { jobId } : undefined);
}
