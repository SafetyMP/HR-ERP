import type { Prisma } from "@/app/generated/prisma/client";

const DEFAULT_FULL_DAY_MINUTES = 8 * 60;

export interface SprintCapacityRow {
  employeeId: string;
  employeeEmail: string;
  baselineMinutes: number;
  reducedMinutes: number;
  netMinutes: number;
  holidayDates: string[];
}

/** Enumerate inclusive calendar dates (YYYY-MM-DD strings) spanned by sprint bounds in UTC. */
export function sprintUtcDateKeys(startUtc: Date, endUtc: Date): string[] {
  const keys = new Set<string>();

  const start = new Date(startUtc);
  const day = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const end = new Date(endUtc);
  const endCeil = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );

  while (day <= endCeil) {
    keys.add(day.toISOString().slice(0, 10));
    day.setUTCDate(day.getUTCDate() + 1);
  }

  return [...keys].sort();
}

async function holidayDatesForEmployee(
  tx: Prisma.TransactionClient,
  employeeId: string,
  calendarDateKeys: Set<string>,
): Promise<Array<{ localDate: Date; observationId: string | null }>> {
  const hits: Array<{ localDate: Date; observationId: string | null }> = [];

  const regions = await tx.employeeHolidayRegion.findMany({
    where: { employeeId },
    include: {
      calendar: {
        include: {
          observations: {
            include: {
              dates: true,
            },
          },
        },
      },
    },
    orderBy: [{ priority: "desc" }],
  });

  const seenDates = new Set<string>();

  for (const link of regions) {
    for (const obs of link.calendar.observations) {
      for (const dt of obs.dates) {
        const key = dt.localDate.toISOString().slice(0, 10);
        if (!calendarDateKeys.has(key)) {
          continue;
        }
        if (seenDates.has(key)) {
          continue;
        }
        hits.push({ localDate: dt.localDate, observationId: obs.id });
        seenDates.add(key);
      }
    }
  }

  return hits.sort((a, b) => a.localDate.getTime() - b.localDate.getTime());
}

export async function rebuildStatutoryAdjustmentsForSprint(
  tx: Prisma.TransactionClient,
  sprintId: string,
): Promise<void> {
  await tx.capacityAdjustment.deleteMany({
    where: {
      sprintId,
      reason: "STATUTORY_HOLIDAY",
    },
  });

  const sprint = await tx.sprint.findUniqueOrThrow({
    where: { id: sprintId },
    select: { tenantId: true, startUtc: true, endUtc: true },
  });

  const keysArr = sprintUtcDateKeys(sprint.startUtc, sprint.endUtc);
  const keySet = new Set(keysArr);

  const employees = await tx.employee.findMany({
    where: { tenantId: sprint.tenantId },
    select: { id: true },
  });

  for (const emp of employees) {
    const hits = await holidayDatesForEmployee(tx, emp.id, keySet);

    for (const hit of hits) {
      await tx.capacityAdjustment.create({
        data: {
          employeeId: emp.id,
          sprintId,
          localDate: hit.localDate,
          reason: "STATUTORY_HOLIDAY",
          minutesReduced: DEFAULT_FULL_DAY_MINUTES,
          holidayObservationId: hit.observationId,
        },
      });
    }
  }
}

export async function summarizeSprintCapacityForTenant(
  tx: Prisma.TransactionClient,
  sprintId: string,
): Promise<SprintCapacityRow[]> {
  const sprint = await tx.sprint.findUniqueOrThrow({
    where: { id: sprintId },
    select: {
      tenantId: true,
      startUtc: true,
      endUtc: true,
    },
  });

  const keysArr = sprintUtcDateKeys(sprint.startUtc, sprint.endUtc);
  const baselineMinutesPerEmployee = keysArr.length * DEFAULT_FULL_DAY_MINUTES;

  const adjustments = await tx.capacityAdjustment.findMany({
    where: { sprintId },
    select: {
      employeeId: true,
      minutesReduced: true,
      reason: true,
      localDate: true,
    },
  });

  const employeeIds = await tx.employee.findMany({
    where: { tenantId: sprint.tenantId },
    select: { id: true, email: true },
  });

  const rows: SprintCapacityRow[] = [];

  for (const e of employeeIds) {
    const empAdj = adjustments.filter((a) => a.employeeId === e.id);
    const reduced = empAdj.reduce((acc, a) => acc + a.minutesReduced, 0);
    const holidayDates = empAdj
      .filter((a) => a.reason === "STATUTORY_HOLIDAY")
      .map((a) => a.localDate.toISOString().slice(0, 10));

    rows.push({
      employeeId: e.id,
      employeeEmail: e.email,
      baselineMinutes: baselineMinutesPerEmployee,
      reducedMinutes: reduced,
      netMinutes: baselineMinutesPerEmployee - reduced,
      holidayDates: [...new Set(holidayDates)].sort(),
    });
  }

  return rows;
}
