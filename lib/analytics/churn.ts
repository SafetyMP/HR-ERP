import type { Prisma } from "@/app/generated/prisma/client";

import { prismaRead } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import type { AuthorizedTxOptions } from "@/lib/security/with-authorized-transaction";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type ChurnScoreRow = Prisma.ChurnScoreGetPayload<{
  include: {
    employee: {
      select: {
        id: true;
        email: true;
        firstName: true;
        lastName: true;
        jobRole: { select: { title: true; canonicalTitle: true } };
      };
    };
  };
}>;

export async function listChurnScoresForTenant(
  auth: AuthContext,
  txOpts: Pick<AuthorizedTxOptions, "permission" | "abac">,
): Promise<ChurnScoreRow[]> {
  return withAuthorizedTransaction(
    prismaRead,
    auth,
    {
      permission: txOpts.permission,
      abac: txOpts.abac,
      resourceClassification: "confidential",
    },
    async (tx) => {
      const raw = await tx.churnScore.findMany({
        where: { tenantId: auth.tenantId },
        orderBy: [{ scoredAt: "desc" }],
        take: 400,
        include: {
          employee: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              jobRole: { select: { title: true, canonicalTitle: true } },
            },
          },
        },
      });
      const seen = new Set<string>();
      const out: typeof raw = [];
      for (const row of raw) {
        if (seen.has(row.employeeId)) continue;
        seen.add(row.employeeId);
        out.push(row);
        if (out.length >= 100) break;
      }
      return out;
    },
  );
}
