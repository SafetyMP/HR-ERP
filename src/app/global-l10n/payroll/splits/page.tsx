import { prisma } from "@/lib/prisma";
import { getDemoTenantId } from "@/lib/l10n/demo-tenant";
import { withTenantRls } from "@/lib/l10n/prisma-tenant";

import { saveContractorSplitPayoutAction } from "../../actions";

export default async function PayrollSplitsPage() {
  const tenantId = getDemoTenantId();
  const contractor = await withTenantRls(
    prisma,
    tenantId,
    "payroll-read",
    async (tx) =>
      tx.employee.findFirstOrThrow({
        where: { tenantId, email: "ken.jp@demo.local" },
        select: { id: true, email: true },
      }),
  );

  return (
    <main className="space-y-6">
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <p className="text-xs uppercase tracking-wide text-zinc-500">
          Payroll flexibility
        </p>
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Multi-currency contractor splits
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Amounts are stored as integer minor units with explicit ISO codes or
          crypto asset identifiers. Consolidated reporting still needs an{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-900">
            FxSnapshot
          </code>{" "}
          — never silent currency mixing.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Demo contractor:{" "}
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {contractor.email}
          </span>
        </p>

        <form action={saveContractorSplitPayoutAction} className="mt-6 space-y-4">
          <input type="hidden" name="employeeId" value={contractor.id} />

          <label className="block text-sm">
            Memo
            <input
              name="memo"
              placeholder="November dual-ledger payout"
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              50% USD / 50% crypto (basis points must total 10_000)
            </p>

            <div className="grid gap-3 md:grid-cols-2">
              <fieldset className="space-y-2 rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <legend className="text-xs uppercase text-zinc-500">
                  Fiat leg
                </legend>
                <input type="hidden" name="lineType" value="CONTRACTOR_PAY" />
                <label className="block text-xs">
                  Percent (bp)
                  <input
                    name="percentBp"
                    defaultValue="5000"
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block text-xs">
                  ISO currency
                  <input
                    name="currencyCode"
                    defaultValue="USD"
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <input type="hidden" name="amountMinor" value="" />
                <input type="hidden" name="cryptoAssetId" value="" />
              </fieldset>

              <fieldset className="space-y-2 rounded border border-zinc-200 p-4 dark:border-zinc-800">
                <legend className="text-xs uppercase text-zinc-500">
                  Crypto leg
                </legend>
                <input type="hidden" name="lineType" value="CONTRACTOR_PAY" />
                <label className="block text-xs">
                  Percent (bp)
                  <input
                    name="percentBp"
                    defaultValue="5000"
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <label className="block text-xs">
                  Asset id (e.g. ethereum:0x…)
                  <input
                    name="cryptoAssetId"
                    defaultValue="ethereum:USDC"
                    className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </label>
                <input type="hidden" name="currencyCode" value="" />
                <input type="hidden" name="amountMinor" value="" />
              </fieldset>
            </div>
          </div>

          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-950"
          >
            Persist instruction
          </button>
        </form>
      </section>
    </main>
  );
}
