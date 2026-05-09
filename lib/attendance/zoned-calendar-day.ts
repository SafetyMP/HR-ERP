import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Start of calendar day in `ianaZone` through start of next calendar day (exclusive end), as UTC instants. */
export function zonedCalendarDayUtcBounds(
  nowUtc: Date,
  ianaZone: string,
): { calendarDate: string; startUtc: Date; endUtcExclusive: Date } {
  const calendarDate = formatInTimeZone(nowUtc, ianaZone, "yyyy-MM-dd");
  const startUtc = fromZonedTime(`${calendarDate}T00:00:00`, ianaZone);
  const noonAnchor = fromZonedTime(`${calendarDate}T12:00:00`, ianaZone);
  const nextCalendarDate = formatInTimeZone(addDays(noonAnchor, 1), ianaZone, "yyyy-MM-dd");
  const endUtcExclusive = fromZonedTime(`${nextCalendarDate}T00:00:00`, ianaZone);
  return { calendarDate, startUtc, endUtcExclusive };
}
