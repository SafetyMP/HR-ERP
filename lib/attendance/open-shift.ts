import type { PunchKind, Prisma } from "@/app/generated/prisma/client";
import { formatInTimeZone } from "date-fns-tz";

export type LatestPunchRow = {
  kind: PunchKind;
  occurredAt: Date;
};

export type OpenShiftState = {
  clockedIn: boolean;
  openShiftStartedAt: string | null;
  openShiftFromPriorDay: boolean;
};

export async function findLatestAttendancePunch(
  tx: Prisma.TransactionClient,
  tenantId: string,
  employeeId: string,
): Promise<LatestPunchRow | null> {
  return tx.attendancePunch.findFirst({
    where: { tenantId, employeeId },
    orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
    select: { kind: true, occurredAt: true },
  });
}

/** True when the employee's most recent punch is an open CLOCK_IN (any calendar day). */
export function isOpenShift(latest: LatestPunchRow | null): boolean {
  return latest?.kind === "CLOCK_IN";
}

export function deriveOpenShiftState(
  latest: LatestPunchRow | null,
  calendarDate: string,
  timeZone: string,
): OpenShiftState {
  if (!latest || latest.kind !== "CLOCK_IN") {
    return {
      clockedIn: false,
      openShiftStartedAt: null,
      openShiftFromPriorDay: false,
    };
  }

  const shiftCalendarDate = formatInTimeZone(latest.occurredAt, timeZone, "yyyy-MM-dd");

  return {
    clockedIn: true,
    openShiftStartedAt: latest.occurredAt.toISOString(),
    openShiftFromPriorDay: shiftCalendarDate !== calendarDate,
  };
}
