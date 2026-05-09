import { describe, expect, it } from "vitest";
import curated from "@/tests/fixtures/employees/curated-scenarios.json";
import type { ScenarioTag } from "@/tests/fixtures/employees/types";
import { buildEmployeeScenario } from "@/tests/fixtures/employees";

describe("EmployeeScenario factory", () => {
  it("applies stacked NY/NJ + FMLA + equity overlays", () => {
    const s = buildEmployeeScenario({
      scenarioId: "unit_stack",
      tags: ["njNyCommuter", "fmlaContinuous", "retroEquityGrantInClosedQuarter"],
    });
    expect(s.extensions.workLocation.primaryWorksiteState).toBe("NY");
    expect(s.extensions.workLocation.residenceState).toBe("NJ");
    expect(s.extensions.leave?.fmla.status).toBe("continuous");
    expect(s.extensions.equity?.some((g) => g.closedLedgerPeriod)).toBe(true);
  });

  it("curated JSON scenario IDs are buildable", () => {
    for (const row of curated as Array<{ scenarioId: string; tenantId: string; tags: ScenarioTag[] }>) {
      const s = buildEmployeeScenario({
        scenarioId: row.scenarioId,
        tenantId: row.tenantId,
        tags: row.tags,
      });
      expect(s.scenarioId).toBe(row.scenarioId);
    }
  });
});
