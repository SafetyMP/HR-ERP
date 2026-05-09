import { prisma } from "@/lib/prisma";
import { VENDOR_KEYS } from "@/lib/integrations/constants";
import {
  decryptTokenBundle,
  encryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";

const LOCK_MS = 45_000;

/**
 * Proactively extends demo M2M tokens before expiry (simulated refresh).
 * Uses `refresh_lock_until` to reduce duplicate refresh under concurrency.
 */
export async function refreshExpiringDemoTokens(
  lookaheadMs = 15 * 60 * 1000,
): Promise<number> {
  const horizon = new Date(Date.now() + lookaheadMs);
  const now = new Date();
  const lockUntil = new Date(Date.now() + LOCK_MS);

  const candidates = await prisma.integrationInstance.findMany({
    where: {
      vendorKey: VENDOR_KEYS.DEMO,
      health: "ACTIVE",
      encryptedTokenBundle: { not: null },
      tokenExpiresAt: { lte: horizon },
      OR: [{ refreshLockUntil: null }, { refreshLockUntil: { lte: now } }],
    },
    take: 25,
  });

  let n = 0;
  for (const row of candidates) {
    const updated = await prisma.integrationInstance.updateMany({
      where: {
        id: row.id,
        OR: [{ refreshLockUntil: null }, { refreshLockUntil: { lte: now } }],
      },
      data: { refreshLockUntil: lockUntil },
    });
    if (updated.count !== 1) continue;

    if (!row.encryptedTokenBundle) continue;

    try {
      const bundle = decryptTokenBundle(
        getIntegrationSecret(),
        row.encryptedTokenBundle,
      );
      const newExpires = new Date(Date.now() + 60 * 60 * 1000);
      const next = encryptTokenBundle(getIntegrationSecret(), {
        accessToken: bundle.accessToken,
        refreshToken: bundle.refreshToken,
        expiresAtIso: newExpires.toISOString(),
      });

      await prisma.integrationInstance.update({
        where: { id: row.id },
        data: {
          encryptedTokenBundle: next,
          tokenExpiresAt: newExpires,
          refreshLockUntil: null,
          health: "ACTIVE",
        },
      });
      n += 1;
    } catch {
      await prisma.integrationInstance.update({
        where: { id: row.id },
        data: {
          refreshLockUntil: null,
          health: "DEGRADED",
        },
      });
    }
  }

  return n;
}
