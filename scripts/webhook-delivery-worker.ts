/**
 * Drains PENDING / RETRY webhook_deliveries with signed HTTPS POSTs.
 *
 * Usage: npm run worker:webhooks
 * Requires DATABASE_URL. Run beside app or integration workers.
 */
import "dotenv/config";

import { processPendingWebhookDeliveries } from "@/lib/webhooks/process-pending-deliveries";

const POLL_MS = Number(process.env.WEBHOOK_DELIVERY_POLL_MS ?? "2000");

async function tick() {
  const result = await processPendingWebhookDeliveries();
  if (result.processed > 0) {
    console.log(
      `[webhooks] processed=${result.processed} ok=${result.succeeded} retry=${result.retryScheduled} failed=${result.failed}`,
    );
  }
}

console.log(`[webhooks] delivery worker polling every ${POLL_MS}ms`);
setInterval(() => {
  tick().catch((e) => console.error("[webhooks]", e));
}, POLL_MS);

tick().catch((e) => console.error("[webhooks]", e));
