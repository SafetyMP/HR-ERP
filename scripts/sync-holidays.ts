import { syncNagerCalendarYear } from "@/lib/holidays/nager-sync";
import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";

async function main() {
  const calendarId = process.env.HOLIDAY_CALENDAR_ID ?? process.argv[2];
  const year = Number(process.env.HOLIDAY_SYNC_YEAR ?? process.argv[3]);

  if (!calendarId || !Number.isFinite(year)) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: HOLIDAY_CALENDAR_ID=... HOLIDAY_SYNC_YEAR=2026 tsx scripts/sync-holidays.ts\n   or tsx scripts/sync-holidays.ts <calendarId> <year>",
    );
    process.exit(1);
  }

  const tenantId = getDemoTenantId();

  const stats = await withTenantRls(
    prisma,
    tenantId,
    "cli-holiday-sync",
    async (tx) => syncNagerCalendarYear(tx, calendarId!, year),
  );

  // eslint-disable-next-line no-console
  console.log("Holiday sync OK:", stats);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
