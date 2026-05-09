/** ISO-8601 calendar date (`YYYY-MM-DD`) in UTC civil-date semantics — no wall-clock timestamps. */

export interface CivilDateIso {
  readonly value: string;
}

export interface DateIntervalIso {
  readonly startInclusive: CivilDateIso;
  /** Exclusive upper bound — interval is `[startInclusive, endExclusive)`. */
  readonly endExclusive: CivilDateIso;
}
