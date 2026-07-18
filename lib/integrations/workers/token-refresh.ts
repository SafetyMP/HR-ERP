import { VENDOR_KEYS } from "@/lib/integrations/constants";
import {
  decryptTokenBundle,
  encryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";
import { getDrainPrisma } from "@/lib/security/drain-db";

const LOCK_MS = 45_000;

/**
 * Proactively extends demo M2M tokens before expiry (simulated refresh).
 * Uses drain role for cross-tenant candidate scan + lock updates.
 */
export async function refreshExpiringDemoTokens(
  lookaheadMs = 15 * 60 * 1000,
): Promise<number> {
  const drain = getDrainPrisma();
  const horizon = new Date(Date.now() + lookaheadMs);
  const now = new Date();
  const lockUntil = new Date(Date.now() + LOCK_MS);

  const candidates = await drain.integrationInstance.findMany({
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
    const updated = await drain.integrationInstance.updateMany({
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

      await drain.integrationInstance.update({
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
      await drain.integrationInstance.update({
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
