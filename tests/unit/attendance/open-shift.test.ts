import { describe, expect, it } from "vitest";

import {
  deriveOpenShiftState,
  isOpenShift,
  type LatestPunchRow,
} from "@/lib/attendance/open-shift";

describe("open-shift attendance semantics", () => {
  it("isOpenShift is true only when latest punch is CLOCK_IN", () => {
    expect(isOpenShift(null)).toBe(false);
    expect(
      isOpenShift({
        kind: "CLOCK_OUT",
        occurredAt: new Date("2026-05-30T17:00:00.000Z"),
      }),
    ).toBe(false);
    expect(
      isOpenShift({
        kind: "CLOCK_IN",
        occurredAt: new Date("2026-05-30T08:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("deriveOpenShiftState marks prior-day open shifts", () => {
    const latest: LatestPunchRow = {
      kind: "CLOCK_IN",
      occurredAt: new Date("2026-05-30T08:00:00.000Z"),
    };

    const state = deriveOpenShiftState(latest, "2026-05-31", "Europe/Berlin");

    expect(state.clockedIn).toBe(true);
    expect(state.openShiftFromPriorDay).toBe(true);
    expect(state.openShiftStartedAt).toBe(latest.occurredAt.toISOString());
  });

  it("deriveOpenShiftState treats today-only punches as same-day open shift", () => {
    const latest: LatestPunchRow = {
      kind: "CLOCK_IN",
      occurredAt: new Date("2026-05-31T07:00:00.000Z"),
    };

    const state = deriveOpenShiftState(latest, "2026-05-31", "Europe/Berlin");

    expect(state.clockedIn).toBe(true);
    expect(state.openShiftFromPriorDay).toBe(false);
  });

  it("deriveOpenShiftState is off the clock after CLOCK_OUT", () => {
    const latest: LatestPunchRow = {
      kind: "CLOCK_OUT",
      occurredAt: new Date("2026-05-31T17:00:00.000Z"),
    };

    const state = deriveOpenShiftState(latest, "2026-05-31", "Europe/Berlin");

    expect(state).toEqual({
      clockedIn: false,
      openShiftStartedAt: null,
      openShiftFromPriorDay: false,
    });
  });

  it("aligns read vs write when today has no punches but shift is open", () => {
    const latest: LatestPunchRow = {
      kind: "CLOCK_IN",
      occurredAt: new Date("2026-05-30T22:00:00.000Z"),
    };

    const readState = deriveOpenShiftState(latest, "2026-05-31", "Europe/Berlin");
    const writeBlocked = isOpenShift(latest);

    expect(readState.clockedIn).toBe(true);
    expect(writeBlocked).toBe(true);
  });
});
