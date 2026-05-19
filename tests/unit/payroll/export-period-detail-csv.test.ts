import { describe, expect, it } from "vitest";

import { buildPeriodDetailCsv } from "@/lib/payroll/export-period-detail-csv";

describe("buildPeriodDetailCsv", () => {
  it("escapes commas in employee names", () => {
    const csv = buildPeriodDetailCsv([
      {
        employeeName: "Lee, Jordan",
        employeeId: "e1",
        lineType: "SALARY",
        amountMinor: 100_00,
        currencyCode: "USD",
      },
    ]);
    expect(csv).toContain('"Lee, Jordan"');
    expect(csv.split("\n")).toHaveLength(2);
  });
});
