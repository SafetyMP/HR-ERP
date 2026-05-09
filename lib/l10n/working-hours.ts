import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface WorkIntervalMinutes {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Builds a UTC `Date` representing **wall clock** (H:M:S) on `dateIso` in `ianaZone`.
 */
export function utcInstantForLocalWallClock(
  dateIso: string,
  minuteOfDay: number,
  ianaZone: string,
): Date {
  const hh = Math.floor(minuteOfDay / 60);
  const mm = minuteOfDay % 60;
  const wall = `${dateIso}T${pad2(hh)}:${pad2(mm)}:00`;
  return fromZonedTime(wall, ianaZone);
}

export interface UtcInterval {
  startUtc: Date;
  endUtc: Date;
}

/**
 * Expands repository work intervals inside `[rangeStartUtc, rangeEndUtc]` into discrete UTC intervals.
 */
export function expandIntervalsToUtc(
  intervals: WorkIntervalMinutes[],
  ianaZone: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
): UtcInterval[] {
  const startAnchor = formatInTimeZone(
    rangeStartUtc,
    ianaZone,
    "yyyy-MM-dd",
  );
  const endYmd = formatInTimeZone(rangeEndUtc, ianaZone, "yyyy-MM-dd");
  const anchorUtc = fromZonedTime(`${startAnchor}T12:00:00`, ianaZone);

  const out: UtcInterval[] = [];

  for (let i = 0; i < 800; i++) {
    const inst = addDays(anchorUtc, i);
    const dateStr = formatInTimeZone(inst, ianaZone, "yyyy-MM-dd");
    if (dateStr > endYmd) {
      break;
    }

    const isoDow = Number.parseInt(
      formatInTimeZone(inst, ianaZone, "i"),
      10,
    );
    const repoDaySunday0 = isoDow % 7;

    for (const w of intervals) {
      if (w.dayOfWeek !== repoDaySunday0) {
        continue;
      }

      const startMinute = w.startMinute;
      let endMinute = w.endMinute;
      if (endMinute <= startMinute) {
        endMinute = startMinute + 30;
      }

      const startUtc = utcInstantForLocalWallClock(dateStr, startMinute, ianaZone);
      const endUtc = utcInstantForLocalWallClock(dateStr, endMinute, ianaZone);

      if (endUtc <= rangeStartUtc || startUtc >= rangeEndUtc) {
        continue;
      }

      const clipStart =
        startUtc < rangeStartUtc ? rangeStartUtc : startUtc;
      const clipEnd = endUtc > rangeEndUtc ? rangeEndUtc : endUtc;

      if (clipEnd > clipStart) {
        out.push({ startUtc: clipStart, endUtc: clipEnd });
      }
    }
  }

  out.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  return out;
}

function intersectPair(
  a: UtcInterval,
  b: UtcInterval,
): UtcInterval | null {
  const s = a.startUtc > b.startUtc ? a.startUtc : b.startUtc;
  const e = a.endUtc < b.endUtc ? a.endUtc : b.endUtc;
  if (!(e > s)) {
    return null;
  }
  return { startUtc: s, endUtc: e };
}

/**
 * Computes intersection across N sets of UTC intervals (e.g. N employees).
 */
export function intersectManyIntervalSets(
  sets: UtcInterval[][],
): UtcInterval[] {
  if (sets.length === 0) {
    return [];
  }
  let acc = sets[0]!;
  for (let i = 1; i < sets.length; i++) {
    const next: UtcInterval[] = [];
    for (const x of acc) {
      for (const y of sets[i]!) {
        const hit = intersectPair(x, y);
        if (hit) {
          next.push(hit);
        }
      }
    }
    acc = mergeAdjacent(next);
  }
  return acc;
}

/** Merge overlaps / adjacency for readability. */
function mergeAdjacent(intervals: UtcInterval[]): UtcInterval[] {
  if (intervals.length === 0) {
    return [];
  }
  const sorted = [...intervals].sort(
    (a, b) => a.startUtc.getTime() - b.startUtc.getTime(),
  );
  const merged: UtcInterval[] = [];
  let cur = sorted[0]!;
  for (let i = 1; i < sorted.length; i++) {
    const nxt = sorted[i]!;
    if (nxt.startUtc <= cur.endUtc) {
      cur = {
        startUtc: cur.startUtc,
        endUtc:
          cur.endUtc > nxt.endUtc ? cur.endUtc : nxt.endUtc,
      };
    } else {
      merged.push(cur);
      cur = nxt;
    }
  }
  merged.push(cur);
  return merged;
}
