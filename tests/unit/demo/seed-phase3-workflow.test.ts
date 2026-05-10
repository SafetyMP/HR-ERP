import { describe, expect, it } from "vitest";

import { buildPhase3DemoWorkflowSteps } from "../../../scripts/seed-phase3-demo";

describe("Phase 3 demo workflow blueprint JSON", () => {
  it("matches WorkflowStepsSchema (stable across seeds)", () => {
    const steps = buildPhase3DemoWorkflowSteps();
    expect(steps).toHaveLength(2);
    expect(steps[0]?.name).toBe("Manager");
    expect(steps[1]?.slaHours).toBe(48);
  });
});
