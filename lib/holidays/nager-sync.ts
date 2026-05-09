import type { Prisma } from "@/app/generated/prisma/client";
import type { HolidayRuleType } from "@/app/generated/prisma/client";

interface NagerHolidayDto {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
}

function slugifyExternalId(
  countryCode: string,
  date: string,
  englishName: string,
): string {
  const safe = englishName
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .slice(0, 80);
  return `nager|${countryCode}|${date}|${safe}`;
}

export async function syncNagerCalendarYear(
  tx: Prisma.TransactionClient,
  calendarId: string,
  year: number,
): Promise<{ upsertedDays: number }> {
  const calendar = await tx.holidayCalendar.findUniqueOrThrow({
    where: { id: calendarId },
    select: {
      id: true,
      jurisdictionCountry: true,
      tenantId: true,
    },
  });

  const cc = calendar.jurisdictionCountry.trim().toUpperCase();
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${encodeURIComponent(cc)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Nager.Date fetch failed ${res.status}: ${url}`);
  }

  const holidays = (await res.json()) as NagerHolidayDto[];

  let upsertedDays = 0;

  await tx.holidayCalendar.update({
    where: { id: calendar.id },
    data: {
      lastSyncedAt: new Date(),
      provider: "nager_at_v3",
    },
  });

  const ruleType: HolidayRuleType = "IMPORTED_ANNUAL";

  for (const row of holidays) {
    const externalId = slugifyExternalId(row.countryCode, row.date, row.name);
    const observation = await tx.holidayObservation.upsert({
      where: {
        holidayCalendarId_externalId: {
          holidayCalendarId: calendar.id,
          externalId,
        },
      },
      update: {
        localNameKey: row.name,
        ruleType,
        source: url,
      },
      create: {
        holidayCalendarId: calendar.id,
        localNameKey: row.name,
        ruleType,
        externalId,
        source: url,
      },
      select: { id: true },
    });

    await tx.holidayObservationDate.upsert({
      where: {
        observationId_localDate: {
          observationId: observation.id,
          localDate: new Date(`${row.date}T12:00:00.000Z`),
        },
      },
      update: {},
      create: {
        observationId: observation.id,
        localDate: new Date(`${row.date}T12:00:00.000Z`),
      },
    });
    upsertedDays++;
  }

  return { upsertedDays };
}
