import { describe, expect, it } from "vitest";

import { inferAttendanceTimeZone } from "@/lib/attendance/infer-attendance-timezone";

describe("inferAttendanceTimeZone", () => {
  it("prefers employee primary timezone", () => {
    expect(inferAttendanceTimeZone("America/Chicago", "DE")).toBe("America/Chicago");
  });

  it("falls back to Germany heuristic", () => {
    expect(inferAttendanceTimeZone(undefined, "DE")).toBe("Europe/Berlin");
  });

  it("defaults to UTC", () => {
    expect(inferAttendanceTimeZone(undefined, undefined)).toBe("UTC");
  });
});
