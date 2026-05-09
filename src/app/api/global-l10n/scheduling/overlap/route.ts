import { NextResponse } from "next/server";
import { z } from "zod";

import {
  expandIntervalsToUtc,
  intersectManyIntervalSets,
} from "@/lib/l10n/working-hours";
import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";
import { formatDualTzPair } from "@/lib/l10n/format";

const bodySchema = z.object({
  tenantId: z.string().optional(),
  employeeIds: z.array(z.string().uuid()).min(1),
  rangeStartUtc: z.string(),
  rangeEndUtc: z.string(),
  viewerTz: z.string(),
  viewerLocale: z.string().default("en-US"),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    tenantId: bodyTenantId,
    employeeIds,
    rangeStartUtc,
    rangeEndUtc,
    viewerTz,
    viewerLocale,
  } = parsed.data;

  const tenantId = bodyTenantId ?? getDemoTenantId();
  const rs = new Date(rangeStartUtc);
  const re = new Date(rangeEndUtc);

  if (!(re > rs)) {
    return NextResponse.json(
      { error: "rangeEndUtc must be after rangeStartUtc" },
      { status: 400 },
    );
  }

  try {
    const enriched = await withTenantRls(
      prisma,
      tenantId,
      "overlap-demo",
      async (tx) => {
        const employees = await tx.employee.findMany({
          where: { id: { in: employeeIds }, tenantId },
          include: {
            workContext: { include: { workIntervals: true } },
            schedulingPreference: true,
          },
        });

        const sets = employees.map((e) => {
          if (!e.workContext) {
            return [];
          }
          return expandIntervalsToUtc(
            e.workContext.workIntervals.map((wi) => ({
              dayOfWeek: wi.dayOfWeek,
              startMinute: wi.startMinute,
              endMinute: wi.endMinute,
            })),
            e.workContext.primaryTimezone,
            rs,
            re,
          );
        });

        const overlap = intersectManyIntervalSets(sets);

        const overlapUtc = overlap.map((x) => ({
          startUtc: x.startUtc.toISOString(),
          endUtc: x.endUtc.toISOString(),
          perEmployeeLabels: employeeIds.map((id) => {
            const emp = employees.find((e) => e.id === id);
            if (!emp?.workContext) {
              return { employeeId: id, error: "no_work_context" as const };
            }
            const pair = formatDualTzPair(
              x.startUtc,
              viewerTz,
              emp.workContext.primaryTimezone,
              viewerLocale,
            );
            const pref = emp.schedulingPreference;

            let quietHoursNote: string | null = null;
            if (
              pref?.quietHoursStartMinute != null &&
              pref?.quietHoursEndMinute != null
            ) {
              quietHoursNote = `Quiet window (minute-of-day, local): ${pref.quietHoursStartMinute}-${pref.quietHoursEndMinute}`;
            }

            const asyncBadge =
              pref?.asyncFirstDefault !== false ? "async_recommended" : "neutral";

            return {
              employeeId: id,
              viewerLabel: pair.viewerLabel,
              theirLabel: pair.counterpartLabel,
              theirTimezone: emp.workContext.primaryTimezone,
              asyncWorkflowBadge: asyncBadge,
              quietHoursNote,
              overlapWindowMinutesGoal: pref?.overlapWindowMinutes ?? 30,
            };
          }),
        }));

        return {
          suggestedMeetingDefault:
            "Propose overlapping slots asynchronously; booking is secondary." as const,
          overlapUtc,
          employeesMissingWorkContext: employees
            .filter((e) => !e.workContext)
            .map((e) => e.id),
        };
      },
    );

    return NextResponse.json(enriched);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "overlap_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
