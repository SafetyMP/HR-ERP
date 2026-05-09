/** UTC calendar date `YYYY-MM-DD` from an instant (Feature 003 effective-date comparisons). */
export function utcCalendarDateString(fromInstant: Date): string {
  return fromInstant.toISOString().slice(0, 10);
}
