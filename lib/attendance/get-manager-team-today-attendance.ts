import { deriveClockedIn, type PunchDto } from "@/lib/attendance/punch-summary";
import { inferAttendanceTimeZone } from "@/lib/attendance/infer-attendance-timezone";
import { zonedCalendarDayUtcBounds } from "@/lib/attendance/zoned-calendar-day";
import { ApiError } from "@/lib/api/v1/errors";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type TeamMemberTodayAttendancePayload = {
  employeeId: string;
  displayName: string;
  calendarDate: string;
  timeZone: string;
  clockedIn: boolean;
  punches: PunchDto[];
};

export type ManagerTeamAttendancePayload = {
  members: TeamMemberTodayAttendancePayload[];
};

function displayName(e: {
  preferredName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const pref = e.preferredName?.trim();
  if (pref) return pref;
  const parts = [e.firstName?.trim(), e.lastName?.trim()].filter(Boolean);
  return parts.length ? parts.join(" ") : "Team member";
}

export async function getManagerTeamTodayAttendance(
  auth: AuthContext,
): Promise<ManagerTeamAttendancePayload> {
  const managerId = auth.subjectEmployeeId;
  if (!managerId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "manager:team_attendance",
      abac: { minMfa: "standard", maxDataClassification: "internal" },
    },
    async (tx) => {
      const reports = await tx.employee.findMany({
        where: { tenantId: auth.tenantId, managerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          preferredName: true,
          organization: true,
          workContext: { select: { primaryTimezone: true } },
        },
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      const now = new Date();
      const members: TeamMemberTodayAttendancePayload[] = [];

      for (const emp of reports) {
        const timeZone = inferAttendanceTimeZone(
          emp.workContext?.primaryTimezone,
          emp.organization.jurisdictionCountry,
        );

        const { calendarDate, startUtc, endUtcExclusive } = zonedCalendarDayUtcBounds(now, timeZone);

        const punchRows = await tx.attendancePunch.findMany({
          where: {
            tenantId: auth.tenantId,
            employeeId: emp.id,
            occurredAt: { gte: startUtc, lt: endUtcExclusive },
          },
          orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
          select: { kind: true, occurredAt: true },
        });

        const punches: PunchDto[] = punchRows.map((r) => ({
          kind: r.kind,
          occurredAt: r.occurredAt.toISOString(),
        }));

        members.push({
          employeeId: emp.id,
          displayName: displayName(emp),
          calendarDate,
          timeZone,
          clockedIn: deriveClockedIn(punches),
          punches,
        });
      }

      return { members };
    },
  );
}
