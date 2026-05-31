import type { PunchKind, Prisma } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { findLatestAttendancePunch, isOpenShift } from "@/lib/attendance/open-shift";

export type AppliedCorrectionPunch = {
  punchId: string;
  idempotentReplay: boolean;
};

/**
 * Materialize an HR-approved correction as an authoritative attendance punch.
 * Idempotent on `(tenantId, correction:${correctionId})`.
 */
export async function applyApprovedCorrectionPunch(
  tx: Prisma.TransactionClient,
  tenantId: string,
  correction: {
    id: string;
    employeeId: string;
    punchKind: PunchKind;
    requestedOccurredAt: Date;
  },
): Promise<AppliedCorrectionPunch> {
  const idempotencyKey = `correction:${correction.id}`;

  const existing = await tx.attendancePunch.findUnique({
    where: {
      tenantId_idempotencyKey: {
        tenantId,
        idempotencyKey,
      },
    },
  });

  if (existing) {
    if (
      existing.employeeId !== correction.employeeId ||
      existing.kind !== correction.punchKind
    ) {
      throw new ApiError(409, {
        code: "conflict",
        message: "correction_punch_replay_mismatch",
      });
    }
    return { punchId: existing.id, idempotentReplay: true };
  }

  const latest = await findLatestAttendancePunch(tx, tenantId, correction.employeeId);

  if (correction.punchKind === "CLOCK_IN" && isOpenShift(latest)) {
    throw new ApiError(409, {
      code: "conflict",
      message: "correction_requires_clock_out_first",
    });
  }

  const row = await tx.attendancePunch.create({
    data: {
      tenantId,
      employeeId: correction.employeeId,
      kind: correction.punchKind,
      occurredAt: correction.requestedOccurredAt,
      source: "correction_approved",
      idempotencyKey,
    },
  });

  return { punchId: row.id, idempotentReplay: false };
}
