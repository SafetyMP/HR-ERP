import { describe, expect, it } from "vitest";

import {
  makeGLAdapter,
  type PayrollComputedPayload,
} from "@/lib/connectors/refs/general-ledger";
import type { ConnectorEvent } from "@/lib/connectors/sdk";

const baseConfig = {
  accounts: {
    grossPayDebit: "6000",
    netPayCredit: "2100",
    employerTaxDebit: "6010",
    employerTaxCredit: "2105",
  },
};

function buildEvent(
  payload: PayrollComputedPayload,
): ConnectorEvent<PayrollComputedPayload> {
  return {
    tenantId: "tenant-1",
    eventType: "domain.payroll.payroll.pay_run.computed",
    category: "payroll",
    correlationId: "corr-1",
    payload,
    occurredAt: new Date(),
  };
}

describe("makeGLAdapter", () => {
  const adapter = makeGLAdapter(baseConfig);

  it("returns null when totals are missing — no GL post for empty pay runs", () => {
    const out = adapter.transform(
      buildEvent({
        payrollPeriodId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-01-15",
        computed: 0,
        totalEmployees: 0,
      }),
    );
    expect(out).toBeNull();
  });

  it("emits balanced debit/credit lines with employer tax pair", () => {
    const out = adapter.transform(
      buildEvent({
        payrollPeriodId: "p1",
        startDate: "2026-01-01",
        endDate: "2026-01-15",
        computed: 5,
        totalEmployees: 5,
        totals: {
          grossPayMinor: "1000000",
          netPayMinor: "750000",
          employerTaxMinor: "80000",
          currencyCode: "USD",
        },
      }),
    );
    expect(out).not.toBeNull();
    expect(out!.externalId).toBe("payroll:p1");
    expect(out!.currencyCode).toBe("USD");
    expect(out!.lines.map((l) => l.side)).toEqual([
      "DEBIT",
      "CREDIT",
      "DEBIT",
      "CREDIT",
    ]);
    expect(out!.lines[0]?.accountCode).toBe("6000");
    expect(out!.lines[2]?.accountCode).toBe("6010");
    expect(out!.lines[2]?.amountMinor).toBe(80000n);
  });

  it("omits employer tax pair when not provided", () => {
    const out = adapter.transform(
      buildEvent({
        payrollPeriodId: "p2",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        computed: 1,
        totalEmployees: 1,
        totals: {
          grossPayMinor: 100,
          netPayMinor: 80,
          currencyCode: "USD",
        },
      }),
    );
    expect(out!.lines).toHaveLength(2);
  });
});
