import { describe, expect, it } from "vitest";

import { deriveClockedIn } from "@/lib/attendance/punch-summary";

describe("deriveClockedIn", () => {
  it("false when no punches", () => {
    expect(deriveClockedIn([])).toBe(false);
  });

  it("true when last punch is CLOCK_IN", () => {
    expect(
      deriveClockedIn([
        { kind: "CLOCK_IN", occurredAt: "2026-05-09T08:00:00.000Z" },
        { kind: "CLOCK_OUT", occurredAt: "2026-05-09T12:00:00.000Z" },
        { kind: "CLOCK_IN", occurredAt: "2026-05-09T13:00:00.000Z" },
      ]),
    ).toBe(true);
  });

  it("false when last punch is CLOCK_OUT", () => {
    expect(
      deriveClockedIn([
        { kind: "CLOCK_IN", occurredAt: "2026-05-09T08:00:00.000Z" },
        { kind: "CLOCK_OUT", occurredAt: "2026-05-09T12:00:00.000Z" },
      ]),
    ).toBe(false);
  });
});
