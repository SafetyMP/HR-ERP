import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";
import { summarizeSprintCapacityForTenant } from "@/lib/holidays/sprint-capacity";

import {
  rebuildSprintCapacityFromForm,
  syncNagerHolidayCalendarAction,
} from "../../actions";

export default async function PlanningSprintPage() {

  const tenantId = getDemoTenantId();

  const ctx = await withTenantRls(
    prisma,
    tenantId,
    "planning-read",
    async (tx) => {
      const sprint = await tx.sprint.findFirstOrThrow({
        where: {
          tenantId,
          name: "GoldenWeekVsThanksgiving",
        },
        select: {
          id: true,
          name: true,
          startUtc: true,
          endUtc: true,
        },
      });

      const calendars = await tx.holidayCalendar.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          jurisdictionCountry: true,
          lastSyncedAt: true,
        },
        orderBy: { jurisdictionCountry: "asc" },
      });

      const rows = await summarizeSprintCapacityForTenant(tx, sprint.id);

      return { sprint, calendars, rows };
    },
  );

  return (
    <main className="space-y-8">
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Capacity planning
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Statutory holiday matrix vs sprint throughput
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Observations ingest from public providers with admin overrides per
          jurisdiction. Deduped overlaps model how multiple regions compress
          the same sprint (e.g. Golden Week overlap with North American turkey
          week).
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {ctx.sprint.name}
        </h2>
        <p className="mt-2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
          {ctx.sprint.startUtc.toISOString()} →{" "}
          {ctx.sprint.endUtc.toISOString()}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <form
            action={rebuildSprintCapacityFromForm}
            className="rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800"
          >
            <input type="hidden" name="sprintId" value={ctx.sprint.id} />
            <p className="font-semibold text-zinc-900 dark:text-zinc-50">
              Rebuild statutory deductions
            </p>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Deletes previous statutory rows for this sprint, then reapplies
              merged holiday calendars per employee jurisdiction links.
            </p>
            <button
              type="submit"
              className="mt-4 rounded-full border border-zinc-300 px-4 py-1.5 text-xs font-medium uppercase tracking-wide hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Recompute sprint load
            </button>
          </form>

          {ctx.calendars.map((cal) => (
            <form
              key={cal.id}
              action={syncNagerHolidayCalendarAction}
              className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700"
            >
              <input type="hidden" name="calendarId" value={cal.id} />
              <label className="block text-xs text-zinc-600 dark:text-zinc-400">
                Year
                <input
                  name="year"
                  defaultValue={2026}
                  className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </label>
              <p className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {cal.jurisdictionCountry} · {cal.name}
              </p>
              <p className="text-xs text-zinc-500">
                Last sync:{" "}
                {cal.lastSyncedAt
                  ? cal.lastSyncedAt.toISOString()
                  : "never (run import)"}
              </p>
              <button
                type="submit"
                className="mt-3 rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-950"
              >
                Pull statutory days (Nager)
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Sprint capacity rollup
        </h3>
        <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2">Employee</th>
                <th className="px-4 py-2">Baseline (min)</th>
                <th className="px-4 py-2">Reduced (min)</th>
                <th className="px-4 py-2">Net (min)</th>
                <th className="px-4 py-2">Holiday dates</th>
              </tr>
            </thead>
            <tbody>
              {ctx.rows.map((r) => (
                <tr
                  key={r.employeeId}
                  className="border-t border-zinc-200 dark:border-zinc-800"
                >
                  <td className="px-4 py-2 font-mono text-xs">{r.employeeEmail}</td>
                  <td className="px-4 py-2">{r.baselineMinutes}</td>
                  <td className="px-4 py-2">{r.reducedMinutes}</td>
                  <td className="px-4 py-2">{r.netMinutes}</td>
                  <td className="px-4 py-2 text-xs">{r.holidayDates.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
