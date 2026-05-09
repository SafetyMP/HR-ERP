export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "regulated";

export type MfaLevel = "none" | "standard" | "step_up";

/** Declarative constraints attached to route policies (evaluated server-side). */
export interface AbacConstraints {
  /** Minimum MFA assurance for the route. */
  minMfa?: MfaLevel;
  /** Highest resource classification the route may return without step-up. */
  maxDataClassification?: DataClassification;
}

const MFA_RANK: Record<MfaLevel, number> = {
  none: 0,
  standard: 1,
  step_up: 2,
};

const DATA_RANK: Record<DataClassification, number> = {
  public: 0,
  internal: 1,
  confidential: 2,
  regulated: 3,
};

export function mfaSatisfies(
  actual: MfaLevel,
  required: MfaLevel | undefined,
): boolean {
  if (!required) return true;
  return MFA_RANK[actual] >= MFA_RANK[required];
}

export function classificationAllowed(
  resource: DataClassification,
  maxAllowed: DataClassification | undefined,
): boolean {
  if (!maxAllowed) return true;
  return DATA_RANK[resource] <= DATA_RANK[maxAllowed];
}
