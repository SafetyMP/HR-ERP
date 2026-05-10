import type { CivilDateIso, DateIntervalIso } from "./calendar";
import {
  intersectIntervals,
  intervalLengthDaysUtc,
  utcEpochDayFromIso,
} from "./dates";
import type { CanonicalMoney, RoundingMode } from "./numerics";
import { Rational, moneyAdd, moneyFromMinor, multiplyMoneyMinor, zeroMoney } from "./numerics";

export type ProrationStrategy =
  | { readonly kind: "calendar_days" }
  | {
      readonly kind: "work_hours";
      /** Keyed by `${startInclusive}|${endExclusive}` using the same ISO strings as produced breakpoints. */
      readonly hoursBySegmentKey: Readonly<Record<string, bigint>>;
    };

export interface CompensationRateSlice {
  readonly effectiveStartInclusive: CivilDateIso;
  readonly effectiveEndExclusive?: CivilDateIso | null;
  readonly fullPeriodGrossTarget: CanonicalMoney;
}

export interface PaySegment {
  readonly id: string;
  readonly interval: DateIntervalIso;
  readonly calendarDays: bigint;
  readonly periodFraction: Rational;
  readonly appliedSlice: CompensationRateSlice;
  readonly segmentGross: CanonicalMoney;
}

function pickActiveSlice(
  segmentStart: CivilDateIso,
  slices: readonly CompensationRateSlice[],
): CompensationRateSlice {
  const startDay = utcEpochDayFromIso(segmentStart);
  const candidates = slices.filter((s) => {
    if (utcEpochDayFromIso(s.effectiveStartInclusive) > startDay) return false;
    if (s.effectiveEndExclusive == null) return true;
    return utcEpochDayFromIso(s.effectiveEndExclusive) > startDay;
  });
  if (candidates.length === 0) {
    throw new RangeError("segmentizer: no compensation slice covers segment start");
  }
  candidates.sort((a, b) =>
    Number(utcEpochDayFromIso(b.effectiveStartInclusive) - utcEpochDayFromIso(a.effectiveStartInclusive)),
  );
  return candidates[0]!;
}

function uniqueSortedStarts(days: Set<string>): CivilDateIso[] {
  return [...days]
    .sort((a, b) => Number(utcEpochDayFromIso(a) - utcEpochDayFromIso(b)))
    .map((d) => ({ value: d } as CivilDateIso));
}

function collectBreakpointIsoDays(
  payPeriod: DateIntervalIso,
  slices: readonly CompensationRateSlice[],
): Set<string> {
  const p0 = utcEpochDayFromIso(payPeriod.startInclusive);
  const p1 = utcEpochDayFromIso(payPeriod.endExclusive);
  const out = new Set<string>();
  out.add(payPeriod.startInclusive.value);
  for (const s of slices) {
    const s0 = utcEpochDayFromIso(s.effectiveStartInclusive);
    if (s0 > p0 && s0 < p1) out.add(s.effectiveStartInclusive.value);
    if (s.effectiveEndExclusive) {
      const e = utcEpochDayFromIso(s.effectiveEndExclusive);
      if (e > p0 && e < p1) out.add(s.effectiveEndExclusive.value);
    }
  }
  out.add(payPeriod.endExclusive.value);
  return out;
}

/**
 * Stateless segmentization: merges effective-dated pay slices inside `[start,end)` and prorates per strategy.
 *
 * Fractions always sum exactly to `1` rationally (`calendar_days` partitions the pay period).
 * Monetary sums may drift by pennies vs a single-shot rounded full-period accrual; callers may call
 * [`applyResidualToSegments`] posting journals.
 */
export function segmentizePayPeriod(
  payPeriod: DateIntervalIso,
  slices: readonly CompensationRateSlice[],
  strategy: ProrationStrategy,
  rounding: RoundingMode,
): readonly PaySegment[] {
  if (slices.length === 0) throw new RangeError("segmentizer: slices must be non-empty");
  const periodDays = intervalLengthDaysUtc(payPeriod);
  if (periodDays <= 0n) throw new RangeError("segmentizer: invalid pay period");

  const isoBreakpoints = collectBreakpointIsoDays(payPeriod, slices);
  const ordered = uniqueSortedStarts(isoBreakpoints);
  const segments: PaySegment[] = [];

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const startInclusive = ordered[i]!;
    const endExclusive = ordered[i + 1]!;
    const candidate: DateIntervalIso = { startInclusive, endExclusive };
    const sliceWindow = intersectIntervals(payPeriod, candidate);
    if (!sliceWindow) continue;
    const segDays = intervalLengthDaysUtc(sliceWindow);
    if (segDays === 0n) continue;

    const applied = pickActiveSlice(sliceWindow.startInclusive, slices);
    let fraction: Rational;
    if (strategy.kind === "calendar_days") {
      fraction = new Rational(segDays, periodDays);
    } else {
      const key = `${sliceWindow.startInclusive.value}|${sliceWindow.endExclusive.value}`;
      const hours = strategy.hoursBySegmentKey[key];
      if (hours == null) {
        throw new TypeError(`work_hours proration missing hours for segment key ${JSON.stringify(key)}`);
      }
      const total = Object.values(strategy.hoursBySegmentKey).reduce((a, h) => a + h, 0n);
      if (total <= 0n) throw new RangeError("work_hours proration: total hours must be > 0");
      fraction = new Rational(hours, total);
    }

    const segmentGross = multiplyMoneyMinor(applied.fullPeriodGrossTarget, fraction, rounding);
    segments.push({
      id: `seg_${segments.length}`,
      interval: sliceWindow,
      calendarDays: segDays,
      periodFraction: fraction,
      appliedSlice: applied,
      segmentGross,
    });
  }

  if (segments.length === 0) throw new RangeError("segmentizer: produced zero segments — check overlaps");
  return segments;
}

/** Apply bookkeeping residual so line items tie to finance-posted totals (± minor units drift). */
export function applyResidualToSegments(segments: readonly PaySegment[], residualMinorDelta: bigint): PaySegment[] {
  if (segments.length === 0) return [...segments];
  const lastIdx = segments.length - 1;
  return segments.map((s, idx) =>
    idx === lastIdx
      ? {
          ...s,
          segmentGross: moneyFromMinor({
            currencyCode: s.segmentGross.currencyCode,
            scale: s.segmentGross.scale,
            minor: s.segmentGross.minor + residualMinorDelta,
          }),
        }
      : s,
  );
}

export function aggregateSegmentGross(segments: readonly PaySegment[]): CanonicalMoney {
  if (segments.length === 0) {
    throw new RangeError("aggregateSegmentGross: empty");
  }
  const baseCurrency = segments[0]!.segmentGross.currencyCode;
  const baseScale = segments[0]!.segmentGross.scale;
  let acc = zeroMoney(baseCurrency, baseScale);
  for (const s of segments) {
    acc = moneyAdd(acc, s.segmentGross);
  }
  return acc;
}
