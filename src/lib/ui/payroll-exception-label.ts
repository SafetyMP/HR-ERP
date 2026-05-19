const LABELS: Record<string, string> = {
  NO_COMPENSATION: "No compensation on file",
  SKIPPED_EXISTING: "Already paid this period",
  VALIDATION_ERROR: "Payroll validation issue",
};

export function payrollExceptionLabel(code: string): string {
  return LABELS[code] ?? code.replace(/_/g, " ").toLowerCase();
}
