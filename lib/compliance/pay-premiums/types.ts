/** Supported v1 geo ids from jurisdiction-matrix-pay-premiums.yaml */
export type PremiumGeoId = "US-FED" | "US-CA" | "US-NY" | "US-CO" | "US-TX";

export type PunchKind = "IN" | "OUT";

export interface PremiumPunchInput {
  readonly kind: PunchKind;
  readonly occurredAt: Date;
}

export interface PremiumAllocationResult {
  readonly geoId: PremiumGeoId;
  readonly rulePackVersion: string;
  readonly regularMinutes: number;
  readonly overtimeMinutes: number;
  readonly doubletimeMinutes: number;
  readonly warnings: readonly string[];
}

export interface AllocatePremiumHoursInput {
  readonly geoId: PremiumGeoId;
  readonly punches: readonly PremiumPunchInput[];
  /** When true, emits zero premium minutes (INV-2). */
  readonly flsaExempt: boolean;
  /** Standard hours for weekly OT threshold (from matrix; never hard-code 40 in code paths). */
  readonly standardHoursForWeeklyOt: number;
}
