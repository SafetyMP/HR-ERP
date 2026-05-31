import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { ApiError } from "@/lib/api/v1/errors";
import { inferAttendanceTimeZone } from "@/lib/attendance/infer-attendance-timezone";
import {
  deriveOpenShiftState,
  findLatestAttendancePunch,
} from "@/lib/attendance/open-shift";
import { type PunchDto } from "@/lib/attendance/punch-summary";
import { zonedCalendarDayUtcBounds } from "@/lib/attendance/zoned-calendar-day";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type TodayAttendancePayload = {
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  openShiftStartedAt: string | null;
  openShiftFromPriorDay: boolean;
  punches: PunchDto[];
};

export async function getTodayAttendanceSummary(
  auth: AuthContext,
): Promise<TodayAttendancePayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "attendance:clock",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const employee = await tx.employee.findFirst({
        where: { id: employeeId, tenantId: auth.tenantId },
        include: {
          organization: true,
          workContext: { select: { primaryTimezone: true } },
        },
      });

      if (!employee) {
        throw new ApiError(403, {
          code: "forbidden",
          message: "employee_not_found_for_principal",
        });
      }

      const timeZone = inferAttendanceTimeZone(
        employee.workContext?.primaryTimezone,
        employee.organization.jurisdictionCountry,
      );

      const { calendarDate, startUtc, endUtcExclusive } = zonedCalendarDayUtcBounds(
        new Date(),
        timeZone,
      );

      const rows = await tx.attendancePunch.findMany({
        where: {
          tenantId: auth.tenantId,
          employeeId,
          occurredAt: {
            gte: startUtc,
            lt: endUtcExclusive,
          },
        },
        orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
        select: {
          kind: true,
          occurredAt: true,
        },
      });

      const punches: PunchDto[] = rows.map((r) => ({
        kind: r.kind,
        occurredAt: r.occurredAt.toISOString(),
      }));

      const latest = await findLatestAttendancePunch(tx, auth.tenantId, employeeId);
      const openShift = deriveOpenShiftState(latest, calendarDate, timeZone);

      return {
        calendarDate,
        timeZone,
        clockedIn: openShift.clockedIn,
        openShiftStartedAt: openShift.openShiftStartedAt,
        openShiftFromPriorDay: openShift.openShiftFromPriorDay,
        punches,
      };
    },
  );
}
