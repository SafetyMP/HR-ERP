import { describe, expect, it } from "vitest";

import { WorkflowStepsSchema } from "@/lib/workflow/engine";

describe("WorkflowStepsSchema", () => {
  it("accepts a canonical 2-step approval blueprint", () => {
    const parsed = WorkflowStepsSchema.parse([
      { name: "Manager", approverRoles: ["manager"] },
      { name: "HR Admin", approverRoles: ["hr_admin"], slaHours: 48 },
    ]);
    expect(parsed).toHaveLength(2);
    expect(parsed[1]?.slaHours).toBe(48);
  });

  it("rejects empty step list", () => {
    expect(() => WorkflowStepsSchema.parse([])).toThrow();
  });

  it("rejects step without approver roles", () => {
    expect(() =>
      WorkflowStepsSchema.parse([{ name: "Bad", approverRoles: [] }]),
    ).toThrow();
  });

  it("caps step list at 10 to prevent runaway blueprints", () => {
    const tooMany = Array.from({ length: 11 }, (_, i) => ({
      name: `Step ${i}`,
      approverRoles: ["manager"],
    }));
    expect(() => WorkflowStepsSchema.parse(tooMany)).toThrow();
  });
});
