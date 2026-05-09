/**
 * Best-effort IANA zone for attendance “today” boundaries when employee work context is unset.
 */
export function inferAttendanceTimeZone(
  employeePrimaryTimezone: string | null | undefined,
  jurisdictionCountry: string | null | undefined,
): string {
  const trimmed = employeePrimaryTimezone?.trim();
  if (trimmed) return trimmed;
  if (jurisdictionCountry === "DE") return "Europe/Berlin";
  return "UTC";
}
