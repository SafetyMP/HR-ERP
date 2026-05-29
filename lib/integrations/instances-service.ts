import { createHash } from "node:crypto";

import type { Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import {
  encryptTokenBundle,
  getIntegrationSecret,
} from "@/lib/integrations/crypto/tokens";
import { VENDOR_KEYS } from "@/lib/integrations/constants";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type IntegrationInstanceView = {
  id: string;
  vendorKey: string;
  health: string;
  config: Record<string, unknown>;
  hasCredentials: boolean;
  updatedAt: string;
};

export async function listIntegrationInstances(
  auth: AuthContext,
): Promise<IntegrationInstanceView[]> {
  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "integrations:configure",
      abac: { minMfa: "step_up", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const rows = await tx.integrationInstance.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: { vendorKey: "asc" },
      });
      return rows.map((row) => ({
        id: row.id,
        vendorKey: row.vendorKey,
        health: row.health,
        config: (row.configJson as Record<string, unknown> | null) ?? {},
        hasCredentials: Boolean(row.encryptedTokenBundle),
        updatedAt: row.updatedAt.toISOString(),
      }));
    },
  );
}

export async function upsertIntegrationInstance(
  auth: AuthContext,
  input: {
    vendorKey: string;
    config?: Record<string, unknown>;
    webhookSecret?: string;
  },
): Promise<IntegrationInstanceView> {
  const allowedKeys: string[] = Object.values(VENDOR_KEYS);
  if (!allowedKeys.includes(input.vendorKey)) {
    throw new ApiError(400, {
      code: "validation_error",
      message: "unsupported_vendor_key",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "integrations:configure",
      abac: { minMfa: "step_up", maxDataClassification: "confidential" },
      resourceClassification: "confidential",
    },
    async (tx) => {
      const encryptedTokenBundle =
        input.webhookSecret && input.webhookSecret.length >= 32
          ? encryptTokenBundle(getIntegrationSecret(), {
              accessToken: input.webhookSecret,
              expiresAtIso: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            })
          : undefined;

      const row = await tx.integrationInstance.upsert({
        where: {
          tenantId_vendorKey: {
            tenantId: auth.tenantId,
            vendorKey: input.vendorKey,
          },
        },
        create: {
          tenantId: auth.tenantId,
          vendorKey: input.vendorKey,
          configJson: (input.config ?? {}) as Prisma.InputJsonValue,
          encryptedTokenBundle,
        },
        update: {
          configJson: input.config
            ? (input.config as Prisma.InputJsonValue)
            : undefined,
          ...(encryptedTokenBundle ? { encryptedTokenBundle } : {}),
        },
      });

      return {
        id: row.id,
        vendorKey: row.vendorKey,
        health: row.health,
        config: (row.configJson as Record<string, unknown> | null) ?? {},
        hasCredentials: Boolean(row.encryptedTokenBundle),
        updatedAt: row.updatedAt.toISOString(),
      };
    },
  );
}

export function stableExportId(parts: {
  tenantId: string;
  payrollPeriodId: string;
  integrationId: string;
  payloadHash: string;
}): string {
  return createHash("sha256")
    .update(
      `${parts.tenantId}:${parts.payrollPeriodId}:${parts.integrationId}:${parts.payloadHash}`,
    )
    .digest("hex")
    .slice(0, 32);
}
