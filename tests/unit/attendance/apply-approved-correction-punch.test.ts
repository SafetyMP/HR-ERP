import { describe, expect, it, vi } from "vitest";

import type { Prisma } from "@/app/generated/prisma/client";
import { applyApprovedCorrectionPunch } from "@/lib/attendance/apply-approved-correction-punch";

function makeTx(options: {
  existing?: {
    id: string;
    employeeId: string;
    kind: "CLOCK_IN" | "CLOCK_OUT";
  } | null;
  latest?: { kind: "CLOCK_IN" | "CLOCK_OUT"; occurredAt: Date } | null;
  createdId?: string;
}) {
  const create = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: options.createdId ?? "punch-new",
    ...data,
  }));

  return {
    attendancePunch: {
      findUnique: vi.fn(async () => options.existing ?? null),
      findFirst: vi.fn(async () => options.latest ?? null),
      create,
    },
    _create: create,
  } as unknown as Prisma.TransactionClient & { _create: ReturnType<typeof vi.fn> };
}

describe("applyApprovedCorrectionPunch", () => {
  const tenantId = "tenant-1";
  const correction = {
    id: "corr-1",
    employeeId: "emp-1",
    punchKind: "CLOCK_OUT" as const,
    requestedOccurredAt: new Date("2026-05-30T17:00:00.000Z"),
  };

  it("creates a punch with a correction-scoped idempotency key", async () => {
    const tx = makeTx({ latest: null });

    const result = await applyApprovedCorrectionPunch(tx, tenantId, correction);

    expect(result).toEqual({ punchId: "punch-new", idempotentReplay: false });
    expect(tx._create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId,
        employeeId: correction.employeeId,
        kind: correction.punchKind,
        occurredAt: correction.requestedOccurredAt,
        source: "correction_approved",
        idempotencyKey: "correction:corr-1",
      }),
    });
  });

  it("replays idempotently when the punch already exists", async () => {
    const tx = makeTx({
      existing: {
        id: "punch-existing",
        employeeId: correction.employeeId,
        kind: correction.punchKind,
      },
    });

    const result = await applyApprovedCorrectionPunch(tx, tenantId, correction);

    expect(result).toEqual({ punchId: "punch-existing", idempotentReplay: true });
    expect(tx._create).not.toHaveBeenCalled();
  });

  it("rejects CLOCK_IN when the employee is still on the clock", async () => {
    const tx = makeTx({
      latest: {
        kind: "CLOCK_IN",
        occurredAt: new Date("2026-05-30T08:00:00.000Z"),
      },
    });

    await expect(
      applyApprovedCorrectionPunch(tx, tenantId, {
        ...correction,
        punchKind: "CLOCK_IN",
      }),
    ).rejects.toMatchObject({
      payload: { message: "correction_requires_clock_out_first" },
    });
  });
});
