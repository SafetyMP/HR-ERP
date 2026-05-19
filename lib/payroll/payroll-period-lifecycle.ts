import type { PayrollPeriodStatus } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";

const TERMINAL_STATUSES: ReadonlySet<PayrollPeriodStatus> = new Set([
  "LOCKED",
  "ARTIFACT_GENERATED",
]);

export function assertPeriodAllowsPayRun(status: PayrollPeriodStatus): void {
  if (TERMINAL_STATUSES.has(status)) {
    throw new ApiError(409, {
      code: "conflict",
      message: "payroll_period_locked",
    });
  }
}

export function statusAfterPayRun(
  computedCount: number,
  current: PayrollPeriodStatus,
): PayrollPeriodStatus {
  if (TERMINAL_STATUSES.has(current)) {
    return current;
  }
  if (computedCount > 0) {
    return "COMPUTED";
  }
  return current === "OPEN" ? "OPEN" : current;
}

export function statusAfterLock(): PayrollPeriodStatus {
  return "LOCKED";
}

export function statusAfterArtifact(): PayrollPeriodStatus {
  return "ARTIFACT_GENERATED";
}
