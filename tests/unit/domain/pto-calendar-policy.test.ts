import { describe, expect, it } from "vitest";
import {
  hasDuplicateCalendarDay,
  utcCalendarKey,
  validatePtoRequestWindow,
} from "@/lib/qa/pto-calendar-policy";
import { generateEmployeeScenarioBatch } from "@/tests/fixtures/employees";

describe("pto-calendar-policy", () => {
  it("detects duplicate UTC calendar keys", () => {
    const a = new Date("2026-05-09T04:00:00.000Z");
    const b = new Date("2026-05-09T18:00:00.000Z");
    expect(utcCalendarKey(a)).toBe(utcCalendarKey(b));
    expect(hasDuplicateCalendarDay([a, b])).toBe(true);
  });

  it("rejects inverted ranges", () => {
    const err = validatePtoRequestWindow(
      new Date("2026-05-10"),
      new Date("2026-05-01"),
    );
    expect(err?.code).toBe("INVALID_RANGE");
  });

  it("fixture batch is deterministic by seed", () => {
    const a = generateEmployeeScenarioBatch({ seed: 999, count: 50 });
    const b = generateEmployeeScenarioBatch({ seed: 999, count: 50 });
    expect(a.map((s) => s.scenarioId)).toEqual(b.map((s) => s.scenarioId));
    expect(a[0]?.tags).toEqual(b[0]?.tags);
  });
});
