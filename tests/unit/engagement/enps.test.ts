import { describe, expect, it } from "vitest";

import { classifyEnps, computeEnps } from "@/lib/engagement/surveys";

describe("classifyEnps", () => {
  it.each([
    [10, "promoter"],
    [9, "promoter"],
    [8, "passive"],
    [7, "passive"],
    [6, "detractor"],
    [0, "detractor"],
  ] as const)("classifies %s as %s", (score, bucket) => {
    expect(classifyEnps(score)).toBe(bucket);
  });
});

describe("computeEnps", () => {
  it("returns null below the anonymity threshold (5)", () => {
    expect(computeEnps([10, 9, 8, 7])).toBeNull();
  });

  it("computes %promoters - %detractors", () => {
    const out = computeEnps([10, 10, 9, 7, 4]);
    expect(out).not.toBeNull();
    expect(out!.bucketSize).toBe(5);
    expect(out!.enps).toBe(40);
  });

  it("rounds half-points to nearest integer", () => {
    const out = computeEnps([10, 9, 8, 8, 7, 4, 4]);
    expect(out!.enps).toBe(0);
  });

  it("rejects out-of-range scores", () => {
    expect(() => computeEnps([5, 12, 7, 3, 9])).toThrow();
  });
});
