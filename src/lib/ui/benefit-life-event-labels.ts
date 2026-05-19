const EVENT_TYPE_LABELS: Record<string, string> = {
  MARRIAGE: "Marriage",
  BIRTH_ADOPTION: "Birth or adoption",
  DIVORCE: "Divorce or legal separation",
  LOSS_OF_COVERAGE: "Loss of coverage",
  OTHER: "Other qualifying event",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  HR_REVIEW: "Under review",
  APPLIED: "Applied",
  DENIED: "Denied",
};

export function benefitLifeEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type.replace(/_/g, " ").toLowerCase();
}

export function benefitLifeEventStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ").toLowerCase();
}
