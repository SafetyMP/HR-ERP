/**
 * Pure calendar helpers for PTO / attendance — expand with Temporal + counsel-approved TZ rules.
 */

export function utcCalendarKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function hasDuplicateCalendarDay(requestDates: Date[]): boolean {
  const keys = new Set<string>();
  for (const d of requestDates) {
    const k = utcCalendarKey(d);
    if (keys.has(k)) return true;
    keys.add(k);
  }
  return false;
}

export type PtoValidationFailure =
  | { code: "DUPLICATE_CALENDAR_DAY"; calendarKey: string }
  | { code: "INVALID_RANGE"; reason: string };

export function validatePtoRequestWindow(start: Date, end: Date): PtoValidationFailure | null {
  if (start.getTime() > end.getTime()) {
    return { code: "INVALID_RANGE", reason: "start_after_end" };
  }
  return null;
}
