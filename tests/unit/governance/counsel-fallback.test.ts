import { describe, expect, it } from "vitest";

import {
  detectBuilderIntent,
  counselSatisfied,
  evaluateCounselFallback,
} from "../../../.cursor/hooks/counsel-fallback.mjs";

describe("counsel-fallback", () => {
  it("detects builder intent in prompts", () => {
    expect(detectBuilderIntent("please implement the login fix")).toBe(true);
    expect(detectBuilderIntent("what is the architecture?")).toBe(false);
  });

  it("counselSatisfied when counsel lane started or completed", () => {
    expect(
      counselSatisfied({
        started: [{ function: "counsel" }],
        completed: [],
      }),
    ).toBe(true);
    expect(counselSatisfied({ started: [], completed: [] })).toBe(false);
  });

  it("denies T3 builder without counsel in enforce mode", () => {
    const result = evaluateCounselFallback({
      tier: "T3",
      state: { started: [], completed: [] },
      prompt: "implement the harness fix",
      hookMode: "enforce",
    });
    expect(result.action).toBe("deny");
  });

  it("allows T1 builder without counsel", () => {
    const result = evaluateCounselFallback({
      tier: "T1",
      state: { started: [], completed: [] },
      prompt: "implement feature",
      hookMode: "enforce",
    });
    expect(result.action).toBe("allow");
  });
});
