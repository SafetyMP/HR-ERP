#!/usr/bin/env npx tsx
/**
 * Idempotent: encrypt plaintext webhook_subscription.secret values.
 *
 *   npx tsx scripts/backfill-webhook-secret-encryption.ts
 *   npx tsx scripts/backfill-webhook-secret-encryption.ts --dry-run
 */
import dotenv from "dotenv";

dotenv.config();

import { prisma } from "@/lib/prisma";
import {
  encryptWebhookSecret,
  isEncryptedWebhookSecret,
} from "@/lib/webhooks/secret-crypto";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const rows = await prisma.webhookSubscription.findMany({
    select: { id: true, secret: true },
  });

  let updated = 0;
  for (const row of rows) {
    if (isEncryptedWebhookSecret(row.secret)) continue;
    updated += 1;
    if (dryRun) {
      console.log(`would encrypt subscription ${row.id}`);
      continue;
    }
    await prisma.webhookSubscription.update({
      where: { id: row.id },
      data: { secret: encryptWebhookSecret(row.secret) },
    });
  }

  console.log(
    dryRun
      ? `dry-run: ${updated} subscription(s) would be encrypted (${rows.length} total)`
      : `encrypted ${updated} subscription(s) (${rows.length} total)`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
