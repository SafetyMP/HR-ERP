import { describe, expect, it } from "vitest";

import { validateTimeOffRequestDates } from "@/lib/pto/validate-time-off-request";

const hasDb = Boolean(process.env.DATABASE_URL?.trim());

describe.skipIf(!hasDb)("leave request validation (Feature 006)", () => {
  it("rejects inverted date ranges", () => {
    expect(() =>
      validateTimeOffRequestDates({
        startDate: "2026-06-10",
        endDate: "2026-06-01",
      }),
    ).toThrow(/leave_invalid_range/);
  });

  it("rejects ranges over 14 calendar days", () => {
    expect(() =>
      validateTimeOffRequestDates({
        startDate: "2026-06-01",
        endDate: "2026-06-20",
      }),
    ).toThrow(/leave_range_too_long/);
  });

  it("accepts a valid inclusive range", () => {
    expect(
      validateTimeOffRequestDates({
        startDate: "2026-06-01",
        endDate: "2026-06-05",
      }),
    ).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-05",
    });
  });
});
