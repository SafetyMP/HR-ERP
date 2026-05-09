import { describe, expect, it } from "vitest";

import { zonedCalendarDayUtcBounds } from "@/lib/attendance/zoned-calendar-day";

describe("zonedCalendarDayUtcBounds", () => {
  it("returns start before exclusive end for Berlin noon UTC May 9", () => {
    const now = new Date("2026-05-09T12:00:00.000Z");
    const { calendarDate, startUtc, endUtcExclusive } = zonedCalendarDayUtcBounds(now, "Europe/Berlin");
    expect(calendarDate).toBe("2026-05-09");
    expect(startUtc.getTime()).toBeLessThan(endUtcExclusive.getTime());
  });
});
