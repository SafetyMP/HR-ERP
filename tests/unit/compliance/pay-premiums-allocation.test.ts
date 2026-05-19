import { describe, expect, it } from "vitest";

import { allocatePremiumHours } from "@/lib/compliance/pay-premiums";

function punch(kind: "IN" | "OUT", iso: string) {
  return { kind, occurredAt: new Date(iso) };
}

describe("allocatePremiumHours", () => {
  it("US-FED allocates weekly OT above 40 hours", () => {
    const punches = [
      punch("IN", "2026-01-06T08:00:00.000Z"),
      punch("OUT", "2026-01-06T20:00:00.000Z"),
      punch("IN", "2026-01-07T08:00:00.000Z"),
      punch("OUT", "2026-01-07T20:00:00.000Z"),
      punch("IN", "2026-01-08T08:00:00.000Z"),
      punch("OUT", "2026-01-08T20:00:00.000Z"),
      punch("IN", "2026-01-09T08:00:00.000Z"),
      punch("OUT", "2026-01-09T20:00:00.000Z"),
    ];
    const result = allocatePremiumHours({
      geoId: "US-FED",
      punches,
      flsaExempt: false,
      standardHoursForWeeklyOt: 40,
    });
    expect(result.regularMinutes).toBe(40 * 60);
    expect(result.overtimeMinutes).toBe(8 * 60);
    expect(result.doubletimeMinutes).toBe(0);
  });

  it("US-CA applies daily OT after 8 hours in a day", () => {
    const punches = [
      punch("IN", "2026-01-06T08:00:00.000Z"),
      punch("OUT", "2026-01-06T22:00:00.000Z"),
    ];
    const result = allocatePremiumHours({
      geoId: "US-CA",
      punches,
      flsaExempt: false,
      standardHoursForWeeklyOt: 40,
    });
    expect(result.regularMinutes).toBe(8 * 60);
    expect(result.overtimeMinutes).toBe(4 * 60);
    expect(result.doubletimeMinutes).toBe(2 * 60);
  });

  it("exempt worker emits zero OT minutes", () => {
    const punches = [
      punch("IN", "2026-01-06T08:00:00.000Z"),
      punch("OUT", "2026-01-06T20:00:00.000Z"),
    ];
    const result = allocatePremiumHours({
      geoId: "US-FED",
      punches,
      flsaExempt: true,
      standardHoursForWeeklyOt: 40,
    });
    expect(result.overtimeMinutes).toBe(0);
    expect(result.warnings).toContain("COMPLIANCE_EXEMPT_NO_OT");
  });
});
