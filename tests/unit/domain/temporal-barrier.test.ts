import { describe, expect, it } from "vitest";
import { FakeClock } from "@/lib/qa/clock";
import { parallelDuplicateBarrier } from "@/lib/qa/parallel-same-instant";

describe("parallelDuplicateBarrier + FakeClock", () => {
  it("runs concurrent callbacks released from same microtask — timestamps collide when stamped inside barrier", async () => {
    const clock = new FakeClock(Date.UTC(2026, 4, 9, 12, 0, 0, 456));

    const stamps = await parallelDuplicateBarrier(5, async () => clock.nowMs());

    expect(stamps.every((s) => s === stamps[0])).toBe(true);
  });
});
