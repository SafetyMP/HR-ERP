import type { CivilDateIso, DateIntervalIso } from "./calendar";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function assertIso(label: string, s: string): void {
  if (!ISO_RE.test(s)) {
    throw new TypeError(`${label}: expected YYYY-MM-DD, received ${JSON.stringify(s)}`);
  }
}

/** Days since Unix epoch UTC for civil calendar date — stable, DST-free. */
export function utcEpochDayFromIso(isoDate: CivilDateIso | string): bigint {
  const s = typeof isoDate === "string" ? isoDate : isoDate.value;
  assertIso("utcEpochDayFromIso", s);
  const m = ISO_RE.exec(s)!;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const utcMs = Date.UTC(y, mo - 1, d);
  if (!Number.isFinite(utcMs)) {
    throw new RangeError(`Invalid civil date ${JSON.stringify(s)}`);
  }
  return BigInt(Math.trunc(utcMs / 86_400_000));
}

export function civilDate(isoDate: string): CivilDateIso {
  assertIso("civilDate", isoDate);
  return { value: isoDate } as const satisfies CivilDateIso;
}

/** Length in whole days for `[startInclusive, endExclusive)`. */
export function intervalLengthDaysUtc(interval: DateIntervalIso): bigint {
  const a = utcEpochDayFromIso(interval.startInclusive);
  const b = utcEpochDayFromIso(interval.endExclusive);
  if (b <= a) {
    throw new RangeError("intervalLengthDaysUtc: endExclusive must be strictly after startInclusive");
  }
  return b - a;
}

export function isoMax(a: CivilDateIso, b: CivilDateIso): CivilDateIso {
  return utcEpochDayFromIso(a) >= utcEpochDayFromIso(b) ? a : b;
}

export function isoMin(a: CivilDateIso, b: CivilDateIso): CivilDateIso {
  return utcEpochDayFromIso(a) <= utcEpochDayFromIso(b) ? a : b;
}

/** `[lo, hi)` intersection of ISO day intervals, or empty if disjoint. */
export function intersectIntervals(
  a: DateIntervalIso,
  b: DateIntervalIso,
): DateIntervalIso | null {
  const start = isoMax(a.startInclusive, b.startInclusive);
  const end = isoMin(a.endExclusive, b.endExclusive);
  if (utcEpochDayFromIso(end) <= utcEpochDayFromIso(start)) {
    return null;
  }
  return { startInclusive: start, endExclusive: end };
}
