import type {
  CalendarSystem,
  HolidayRuleType,
  NameOrderPreference,
} from "@/app/generated/prisma/client";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";

const MARKER_EMAIL = "l10n-demo.creator@demo.local";

async function replaceWorkIntervals(
  tx: Prisma.TransactionClient,
  workContextId: string,
  rows: readonly (readonly [number, number, number])[],
): Promise<void> {
  await tx.workInterval.deleteMany({
    where: { workContextId },
  });

  await tx.workInterval.createMany({
    data: rows.map(([dayOfWeek, startMinute, endMinute]) => ({
      workContextId,
      dayOfWeek,
      startMinute,
      endMinute,
    })),
  });
}

/**
 * Idempotent bootstrap for local global-l10n demos.
 */
export async function bootstrapGlobalL10nDemo(): Promise<{
  tenantId: string;
  calendarUsId: string;
  calendarJpId: string;
  employeeUsId: string;
  employeeJpId: string;
}> {
  const tenantId = getDemoTenantId();

  return withTenantRls(prisma, tenantId, "global-l10n-seed", async (tx) => {
    await tx.organization.upsert({
      where: { id: tenantId },
      create: {
        id: tenantId,
        name: "Global Localization Demo Org",
        jurisdictionCountry: "US",
        reportingCurrency: "USD",
      },
      update: {
        reportingCurrency: "USD",
      },
    });

    async function calendarFor(country: string, title: string) {
      const found = await tx.holidayCalendar.findFirst({
        where: {
          tenantId,
          jurisdictionCountry: country,
          name: title,
        },
      });

      if (found) {
        return found.id;
      }

      return (
        await tx.holidayCalendar.create({
          data: {
            tenantId,
            jurisdictionCountry: country,
            name: title,
            version: 1,
          },
          select: { id: true },
        })
      ).id;
    }

    const calendarUsId = await calendarFor(
      "US",
      "United States statutory (imported)",
    );
    const calendarJpId = await calendarFor(
      "JP",
      "Japan statutory (imported)",
    );

    const ruleFixed: HolidayRuleType = "FIXED_GREGORIAN";
    const thanksgivingObs = await tx.holidayObservation.upsert({
      where: {
        holidayCalendarId_externalId: {
          holidayCalendarId: calendarUsId,
          externalId: "manual|US-thanksgiving-sample",
        },
      },
      create: {
        holidayCalendarId: calendarUsId,
        localNameKey: "holiday.thanksgiving-matrix-sample",
        ruleType: ruleFixed,
        fixedMonth: 11,
        fixedDay: 26,
        externalId: "manual|US-thanksgiving-sample",
        source: "manual_seed",
      },
      update: {},
      select: { id: true },
    });

    await tx.holidayObservationDate.upsert({
      where: {
        observationId_localDate: {
          observationId: thanksgivingObs.id,
          localDate: new Date("2026-11-26T12:00:00.000Z"),
        },
      },
      create: {
        observationId: thanksgivingObs.id,
        localDate: new Date("2026-11-26T12:00:00.000Z"),
      },
      update: {},
    });

    await tx.employee.upsert({
      where: { tenantId_email: { tenantId, email: MARKER_EMAIL } },
      create: {
        tenantId,
        email: MARKER_EMAIL,
        firstName: "Taylor",
        lastName: "Ops",
      },
      update: {},
    });

    const empUs = await tx.employee.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: "ada.us@demo.local",
        },
      },
      create: {
        tenantId,
        email: "ada.us@demo.local",
        firstName: "Ada",
        lastName: "Chen",
      },
      update: {},
    });

    const empJp = await tx.employee.upsert({
      where: {
        tenantId_email: {
          tenantId,
          email: "ken.jp@demo.local",
        },
      },
      create: {
        tenantId,
        email: "ken.jp@demo.local",
        firstName: "Ken",
        lastName: "Yamamoto",
      },
      update: {},
    });

    const calGreg: CalendarSystem = "GREGORIAN";

    const ctxUs = await tx.employeeWorkContext.upsert({
      where: { employeeId: empUs.id },
      create: {
        employeeId: empUs.id,
        primaryTimezone: "America/Los_Angeles",
        locale: "en-US",
        calendarSystem: calGreg,
        givenName: "Ada",
        familyName: "Chen",
        nameOrderPreference: "GIVEN_FAMILY" satisfies NameOrderPreference,
      },
      update: {
        primaryTimezone: "America/Los_Angeles",
        locale: "en-US",
      },
    });

    await replaceWorkIntervals(tx, ctxUs.id, [
      [1, 9 * 60, 17 * 60],
      [2, 9 * 60, 17 * 60],
      [3, 9 * 60, 17 * 60],
      [4, 9 * 60, 17 * 60],
      [5, 9 * 60, 17 * 60],
    ]);

    const ctxJp = await tx.employeeWorkContext.upsert({
      where: { employeeId: empJp.id },
      create: {
        employeeId: empJp.id,
        primaryTimezone: "Asia/Tokyo",
        locale: "ja-JP",
        calendarSystem: calGreg,
        givenName: "Ken",
        familyName: "Yamamoto",
        nameOrderPreference: "FAMILY_GIVEN",
      },
      update: {
        primaryTimezone: "Asia/Tokyo",
        locale: "ja-JP",
      },
    });

    await replaceWorkIntervals(tx, ctxJp.id, [
      [1, 10 * 60, 19 * 60],
      [2, 10 * 60, 19 * 60],
      [3, 10 * 60, 19 * 60],
      [4, 10 * 60, 19 * 60],
      [5, 10 * 60, 19 * 60],
    ]);

    await tx.schedulingPreference.upsert({
      where: { employeeId: empUs.id },
      create: {
        employeeId: empUs.id,
        asyncFirstDefault: true,
        overlapWindowMinutes: 45,
        quietHoursStartMinute: 22 * 60,
        quietHoursEndMinute: 7 * 60,
      },
      update: {},
    });

    await tx.schedulingPreference.upsert({
      where: { employeeId: empJp.id },
      create: {
        employeeId: empJp.id,
        asyncFirstDefault: true,
        overlapWindowMinutes: 30,
      },
      update: {},
    });

    await tx.employeeHolidayRegion.upsert({
      where: {
        employeeId_holidayCalendarId: {
          employeeId: empUs.id,
          holidayCalendarId: calendarUsId,
        },
      },
      create: {
        employeeId: empUs.id,
        holidayCalendarId: calendarUsId,
        priority: 10,
        label: "payroll_site_us",
      },
      update: { priority: 10 },
    });

    await tx.employeeHolidayRegion.upsert({
      where: {
        employeeId_holidayCalendarId: {
          employeeId: empJp.id,
          holidayCalendarId: calendarJpId,
        },
      },
      create: {
        employeeId: empJp.id,
        holidayCalendarId: calendarJpId,
        priority: 10,
        label: "contract_situs_jp",
      },
      update: { priority: 10 },
    });

    /** Matrix sample: JP employee also observes US corp calendar → overlapping holidays collide in planning. */
    await tx.employeeHolidayRegion.upsert({
      where: {
        employeeId_holidayCalendarId: {
          employeeId: empJp.id,
          holidayCalendarId: calendarUsId,
        },
      },
      create: {
        employeeId: empJp.id,
        holidayCalendarId: calendarUsId,
        priority: 5,
        label: "dual_hq_observer",
      },
      update: { priority: 5 },
    });

    const sprintExisting = await tx.sprint.findFirst({
      where: {
        tenantId,
        teamKey: "platform",
        name: "GoldenWeekVsThanksgiving",
      },
      select: { id: true },
    });

    if (!sprintExisting) {
      await tx.sprint.create({
        data: {
          tenantId,
          teamKey: "platform",
          name: "GoldenWeekVsThanksgiving",
          startUtc: new Date("2026-11-20T00:00:00.000Z"),
          endUtc: new Date("2026-11-30T23:59:59.999Z"),
        },
      });
    }

    return {
      tenantId,
      calendarUsId,
      calendarJpId,
      employeeUsId: empUs.id,
      employeeJpId: empJp.id,
    };
  });
}
