/**
 * Shared IDs for unit / integration / e2e (pass ?scenarioId= on /qa-lab).
 */
export type ScenarioId = string;

/** Legally “busy” overlay tags — extend as domains land (payroll, leave, equity). */
export type ScenarioTag =
  | "njNyCommuter"
  | "fmlaContinuous"
  | "retroEquityGrantInClosedQuarter"
  | "exemptNonExemptSourceConflict"
  | "intermittentFmlaOverlapStd";

export type WorkLocation = {
  primaryWorksiteState: string;
  residenceState: string;
  reciprocalCertificationId?: string;
};

export type LeaveOverlay = {
  fmla: {
    status: "none" | "intermittent" | "continuous";
    effectiveFrom: string;
    estimatedReturn?: string;
  };
  stdLtdOverlap?: boolean;
};

export type EquityOverlay = {
  grantId: string;
  grantDate: string;
  vestingStart: string;
  retroactiveToPayrollPeriodId?: string;
  closedLedgerPeriod?: boolean;
};

export type TaxElectionConflict = {
  /** Contradictory HRIS payloads arriving minutes apart — reconciliation candidate */
  sources: Array<{ vendorKey: string; exempt: boolean; syncedAt: string }>;
};

export type EmployeeScenarioPayload = {
  workLocation: WorkLocation;
  leave?: LeaveOverlay;
  equity?: EquityOverlay[];
  taxElectionConflict?: TaxElectionConflict;
};

export type EmployeeScenario = {
  scenarioId: ScenarioId;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  tags: ScenarioTag[];
  extensions: EmployeeScenarioPayload;
};
