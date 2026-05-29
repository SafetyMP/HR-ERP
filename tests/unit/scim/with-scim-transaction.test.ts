import { describe, expect, it, vi } from "vitest";

import { withScimTransaction } from "@/lib/scim/with-scim-transaction";

describe("withScimTransaction", () => {
  it("sets tenant and subject GUCs inside a transaction", async () => {
    const executeRaw = vi.fn().mockResolvedValue(undefined);
    const transaction = vi.fn(async (fn: (tx: { $executeRaw: typeof executeRaw }) => unknown) =>
      fn({ $executeRaw: executeRaw }),
    );
    const prisma = { $transaction: transaction } as never;

    await withScimTransaction(prisma, { tenantId: "tenant-1" }, async () => "ok");

    expect(executeRaw).toHaveBeenCalledTimes(2);
  });
});
