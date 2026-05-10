import { describe, expect, it } from "vitest";

import { computePayroll } from "@hr-erp/payroll-calc";

import {
  CALC_SEMANTIC_VERSION,
  currencyMinorScale,
} from "@/lib/payroll/policy-defaults";
import {
  annualToPeriodMinor,
  buildPipelineInputForEmployee,
  decimalToMinor,
  ISO_DATE,
} from "@/lib/payroll/run-payroll";

describe("annualToPeriodMinor", () => {
  it("prorates 100,000.00 USD annual over a 14-day period", () => {
    const start = new Date(Date.UTC(2026, 0, 1));
    const endExclusive = new Date(Date.UTC(2026, 0, 15));
    const result = annualToPeriodMinor(10_000_000n, start, endExclusive);
    expect(result).toBe((10_000_000n * 14n) / 365n);
  });

  it("returns zero for a zero-length window", () => {
    const d = new Date(Date.UTC(2026, 0, 1));
    expect(() => annualToPeriodMinor(10_000n, d, d)).toThrow();
  });
});

describe("decimalToMinor", () => {
  it("converts a 2-scale decimal-like value losslessly", () => {
    const stub = { toFixed: (n: number) => (123.45).toFixed(n) };
    expect(decimalToMinor(stub, 2)).toBe(12_345n);
  });

  it("preserves negative magnitudes", () => {
    const stub = { toFixed: (n: number) => (-9.99).toFixed(n) };
    expect(decimalToMinor(stub, 2)).toBe(-999n);
  });

  it("handles zero scale (e.g. JPY)", () => {
    const stub = { toFixed: (n: number) => (350_000).toFixed(n) };
    expect(decimalToMinor(stub, 0)).toBe(350_000n);
  });
});

describe("currencyMinorScale", () => {
  it("returns 2 for USD/EUR/GBP", () => {
    expect(currencyMinorScale("USD")).toBe(2);
    expect(currencyMinorScale("EUR")).toBe(2);
    expect(currencyMinorScale("gbp")).toBe(2);
  });

  it("returns 0 for JPY", () => {
    expect(currencyMinorScale("JPY")).toBe(0);
  });

  it("rejects non ISO-4217 inputs", () => {
    expect(() => currencyMinorScale("US")).toThrow();
    expect(() => currencyMinorScale("USDT")).toThrow();
  });
});

describe("buildPipelineInputForEmployee → computePayroll", () => {
  it("produces deterministic fingerprint + non-negative net pay for biweekly USD payroll", () => {
    const input = buildPipelineInputForEmployee({
      employeeId: "emp_1",
      payRunId: "period_1",
      periodStart: new Date(Date.UTC(2026, 0, 1)),
      periodEndExclusive: new Date(Date.UTC(2026, 0, 15)),
      baseAnnualMinor: 10_000_000n,
      effectiveFrom: new Date(Date.UTC(2025, 0, 1)),
      currencyCode: "USD",
      currencyScale: 2,
    });

    const result = computePayroll(input);
    expect(result.calcSemanticVersion).toBe(CALC_SEMANTIC_VERSION);
    expect(result.inputsFingerprintSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(result.netPay.minor >= 0n).toBe(true);
    const r2 = computePayroll(input);
    expect(r2.inputsFingerprintSha256).toBe(result.inputsFingerprintSha256);
  });
});

describe("ISO_DATE", () => {
  it("formats UTC date as YYYY-MM-DD", () => {
    const d = new Date(Date.UTC(2026, 1, 28));
    expect(ISO_DATE(d)).toBe("2026-02-28");
  });
});
