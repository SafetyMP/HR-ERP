import { describe, expect, it } from "vitest";

import { formatBalanceHoursDisplay } from "@/lib/pto/format-balance-hours";

describe("formatBalanceHoursDisplay", () => {
  it("formats stable numeric rounding consistent with Intl NumberFormat", () => {
    const hours = 40.129;
    const expected = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Math.round(hours * 100) / 100);
    expect(formatBalanceHoursDisplay(hours)).toBe(expected);
  });

  it("does not append a fixed two-decimal suffix for whole-hour values", () => {
    const out = formatBalanceHoursDisplay(40);
    expect(out).not.toMatch(/[.,]00$/);
    expect(out.replace(/\s/g, "")).toMatch(/40/);
  });

  it("returns 0 for non-finite input", () => {
    expect(formatBalanceHoursDisplay(Number.NaN)).toBe("0");
    expect(formatBalanceHoursDisplay(Number.POSITIVE_INFINITY)).toBe("0");
  });
});
