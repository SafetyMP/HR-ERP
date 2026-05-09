import { describe, expect, it } from "vitest";

import { isBenefitEnrollmentActiveOn } from "@/lib/benefits/is-benefit-enrollment-active";

describe("isBenefitEnrollmentActiveOn", () => {
  it("returns false before effectiveFrom", () => {
    expect(
      isBenefitEnrollmentActiveOn(new Date("2026-03-01"), null, "2026-02-15"),
    ).toBe(false);
  });

  it("returns true on effectiveFrom through open end", () => {
    expect(
      isBenefitEnrollmentActiveOn(new Date("2026-01-01"), null, "2026-05-09"),
    ).toBe(true);
  });

  it("returns false after effectiveTo", () => {
    expect(
      isBenefitEnrollmentActiveOn(new Date("2026-01-01"), new Date("2026-03-31"), "2026-04-01"),
    ).toBe(false);
  });

  it("returns true on effectiveTo inclusive", () => {
    expect(
      isBenefitEnrollmentActiveOn(new Date("2026-01-01"), new Date("2026-03-31"), "2026-03-31"),
    ).toBe(true);
  });
});
