function inclusiveCalendarDays(startIsoDate: string, endIsoDate: string): number {
  const s = new Date(`${startIsoDate}T12:00:00.000Z`).getTime();
  const e = new Date(`${endIsoDate}T12:00:00.000Z`).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) return 0;
  return Math.floor((e - s) / 86_400_000) + 1;
}

/** Feature 006 — plain validation for API and tests (throws on invalid range). */
export function validateTimeOffRequestDates(input: {
  startDate: string;
  endDate: string;
}): { startDate: string; endDate: string } {
  const days = inclusiveCalendarDays(input.startDate, input.endDate);
  if (days <= 0) {
    throw new Error("leave_invalid_range");
  }
  if (days > 14) {
    throw new Error("leave_range_too_long");
  }
  return input;
}
