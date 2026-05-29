import { NextResponse } from "next/server";
import { z } from "zod";

import { ApiError } from "@/lib/api/v1/errors";
import {
  DemoApiNotAvailableError,
  demoApiNotAvailableResponse,
} from "@/lib/api/non-production-route";
import {
  requireGlobalL10nApiAuth,
  resolveL10nTenantId,
} from "@/lib/l10n/global-l10n-api-auth";
import {
  expandIntervalsToUtc,
  intersectManyIntervalSets,
} from "@/lib/l10n/working-hours";
import { formatDualTzPair } from "@/lib/l10n/format";
import { prisma } from "@/lib/prisma";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

const bodySchema = z.object({
  tenantId: z.string().optional(),
  employeeIds: z.array(z.string().uuid()).min(1),
  rangeStartUtc: z.string(),
  rangeEndUtc: z.string(),
  viewerTz: z.string(),
  viewerLocale: z.string().default("en-US"),
});

export async function POST(request: Request) {
  try {
    const auth = await requireGlobalL10nApiAuth(request);
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

    const tenantId = resolveL10nTenantId(auth, bodyTenantId);
    const rs = new Date(rangeStartUtc);
    const re = new Date(rangeEndUtc);

    if (!(re > rs)) {
      return NextResponse.json(
        { error: "rangeEndUtc must be after rangeStartUtc" },
        { status: 400 },
      );
    }

    const enriched = await withAuthorizedTransaction(
      prisma,
      auth,
      { permission: "employees:list", resourceClassification: "internal" },
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
    if (e instanceof DemoApiNotAvailableError) {
      return demoApiNotAvailableResponse("global_l10n");
    }
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.payload.message }, { status: e.status });
    }
    const msg = e instanceof Error ? e.message : "overlap_failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
