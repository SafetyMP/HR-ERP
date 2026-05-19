import type { PremiumPunchInput } from "./types";

/**
 * Pair IN/OUT punches into worked intervals; unpaired trailing IN is ignored.
 * Returns worked minutes per UTC calendar day (YYYY-MM-DD).
 */
export function workedMinutesByUtcDay(
  punches: readonly PremiumPunchInput[],
): Map<string, number> {
  const sorted = [...punches].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const byDay = new Map<string, number>();
  let openIn: Date | null = null;

  for (const punch of sorted) {
    if (punch.kind === "IN") {
      openIn = punch.occurredAt;
      continue;
    }
    if (punch.kind === "OUT" && openIn) {
      const startMs = openIn.getTime();
      const endMs = punch.occurredAt.getTime();
      if (endMs > startMs) {
        const minutes = Math.round((endMs - startMs) / 60_000);
        const dayKey = openIn.toISOString().slice(0, 10);
        byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + minutes);
      }
      openIn = null;
    }
  }

  return byDay;
}

export function totalWorkedMinutes(byDay: Map<string, number>): number {
  let total = 0;
  for (const m of byDay.values()) total += m;
  return total;
}
