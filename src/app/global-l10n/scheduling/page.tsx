import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";

import OverlapClient from "./OverlapClient";

export default async function SchedulingPage() {
  const tenantId = getDemoTenantId();
  const ids = await withTenantRls(prisma, tenantId, "sched-read", async (tx) => {
    const people = await tx.employee.findMany({
      where: {
        tenantId,
        email: { in: ["ada.us@demo.local", "ken.jp@demo.local"] },
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: { email: "asc" },
    });
    return people;
  });

  return (
    <main className="space-y-6">
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Async ops
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Working hours + overlap matrix
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Instants stay in UTC — the UI always pairs your clock with each
          collaborator&apos;s zone. The default UX path is propose → confirm →
          async artifacts, not surprise live calls.
        </p>
      </header>

      <OverlapClient
        employeeIds={ids.map((p) => p.id)}
        roster={ids.map((p) => ({ id: p.id, email: p.email }))}
      />
    </main>
  );
}
