import type { EmployeeScenarioPayload, ScenarioTag } from "./types";

const overlayByTag: Record<
  ScenarioTag,
  (base: EmployeeScenarioPayload) => EmployeeScenarioPayload
> = {
  njNyCommuter: (base) => ({
    ...base,
    workLocation: {
      primaryWorksiteState: "NY",
      residenceState: "NJ",
    },
  }),
  fmlaContinuous: (base) => ({
    ...base,
    leave: {
      fmla: { status: "continuous", effectiveFrom: "2026-03-01", estimatedReturn: "2026-06-01" },
    },
  }),
  retroEquityGrantInClosedQuarter: (base) => ({
    ...base,
    equity: [
      ...(base.equity ?? []),
      {
        grantId: "grant-retro-closed-q",
        grantDate: "2026-05-15",
        vestingStart: "2026-01-01",
        retroactiveToPayrollPeriodId: "2026-Q1",
        closedLedgerPeriod: true,
      },
    ],
  }),
  exemptNonExemptSourceConflict: (base) => ({
    ...base,
    taxElectionConflict: {
      sources: [
        { vendorKey: "hris_primary", exempt: true, syncedAt: "2026-05-01T10:00:00.000Z" },
        { vendorKey: "hris_payroll_feed", exempt: false, syncedAt: "2026-05-01T10:00:00.001Z" },
      ],
    },
  }),
  intermittentFmlaOverlapStd: (base) => ({
    ...base,
    leave: {
      fmla: { status: "intermittent", effectiveFrom: "2026-04-01" },
      stdLtdOverlap: true,
    },
  }),
};

export function applyScenarioTags(
  basePayload: EmployeeScenarioPayload,
  tags: ScenarioTag[],
): EmployeeScenarioPayload {
  return tags.reduce((acc, tag) => overlayByTag[tag](acc), { ...basePayload });
}
