import Link from "next/link";

import type { CalendarSystem, NameOrderPreference } from "@/app/generated/prisma/client";

import { formatStructuredDisplayName } from "@/lib/l10n/display-name";
import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";

import {
  ensureGlobalL10nDemoAction,
  upsertEmployeeWorkContextAction,
} from "../actions";

export default async function GlobalProfilePage() {

  const tenantId = getDemoTenantId();

  const crew = await withTenantRls(prisma, tenantId, "profile-read", async (tx) =>
    tx.employee.findMany({
      where: {
        tenantId,
        email: {
          in: ["ada.us@demo.local", "ken.jp@demo.local"],
        },
      },
      include: { workContext: true },
      orderBy: { email: "asc" },
    }),
  );

  const calendars = [
    { code: "GREGORIAN", label: "Gregorian (business default)" },
    {
      code: "ISLAMIC_UMALQURA",
      label: "Islamic (Umm al-Qura approximation flag)",
    },
    { code: "HEBREW", label: "Hebrew civil bridge" },
    { code: "PERSIAN", label: "Persian / Solar Hijri" },
    { code: "CUSTOM", label: "Custom regional calendar" },
  ] as const satisfies readonly { code: CalendarSystem; label: string }[];

  const naming = [
    { code: "GIVEN_FAMILY", label: "Given · Family" },
    { code: "FAMILY_GIVEN", label: "Family · Given" },
    { code: "LEGAL_DOCUMENT_ORDER", label: "Legal-document order" },
  ] as const satisfies readonly { code: NameOrderPreference; label: string }[];

  return (
    <main className="space-y-8">
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Global localization
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Employee identity & calendar nuance
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Structured names (including family-first locales), explicit calendar
          markers, and localized formatting preferences live on{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            EmployeeWorkContext
          </code>
          .
        </p>
      </header>

      <form action={ensureGlobalL10nDemoAction} className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Re-seed localized demo people
        </button>
        <Link
          href="/global-l10n/scheduling"
          className="text-sm text-blue-600 underline dark:text-blue-400"
        >
          Next: async scheduling
        </Link>
      </form>

      <div className="space-y-10">
        {crew.map((emp) => {
          const ctx = emp.workContext;
          return (
            <section
              key={emp.id}
              className="rounded-2xl border border-zinc-200 p-6 shadow-sm dark:border-zinc-800"
            >
              <div className="mb-4 flex flex-col gap-1">
                <p className="text-xs uppercase text-zinc-500">
                  {emp.email}
                </p>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {ctx
                    ? formatStructuredDisplayName(ctx)
                    : `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim()}
                </h2>
                {ctx ? (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Primary zone:{" "}
                    <span className="font-mono">{ctx.primaryTimezone}</span> ·
                    Locale {ctx.locale}
                  </p>
                ) : null}
              </div>

              <form
                action={upsertEmployeeWorkContextAction}
                className="grid gap-4 md:grid-cols-2"
              >
                <input type="hidden" name="employeeId" value={emp.id} />

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    IANA time zone
                  </span>
                  <input
                    name="primaryTimezone"
                    defaultValue={ctx?.primaryTimezone ?? "UTC"}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    BCP-47 locale
                  </span>
                  <input
                    name="locale"
                    defaultValue={ctx?.locale ?? "en-US"}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Preferred civil calendar framing
                  </span>
                  <select
                    name="calendarSystem"
                    defaultValue={ctx?.calendarSystem ?? "GREGORIAN"}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    {calendars.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm">
                  Given name(s)
                  <input
                    name="givenName"
                    defaultValue={ctx?.givenName ?? emp.firstName ?? ""}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>

                <label className="space-y-1 text-sm">
                  Family / surname block
                  <input
                    name="familyName"
                    defaultValue={ctx?.familyName ?? emp.lastName ?? ""}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  Display override (optional — falls back to structured order)
                  <input
                    name="displayName"
                    defaultValue={ctx?.displayName ?? ""}
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>

                <label className="space-y-1 text-sm md:col-span-2">
                  Name order preference
                  <select
                    name="nameOrderPreference"
                    defaultValue={
                      ctx?.nameOrderPreference ?? ("GIVEN_FAMILY" as NameOrderPreference)
                    }
                    className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    {naming.map((n) => (
                      <option key={n.code} value={n.code}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
                  >
                    Save profile
                  </button>
                </div>
              </form>
            </section>
          );
        })}
      </div>
    </main>
  );
}
