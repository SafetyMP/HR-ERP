import type { PunchKind } from "@/app/generated/prisma/client";

export type PunchDto = {
  kind: PunchKind;
  occurredAt: string;
};

/** True when the last punch in chronological order for the day is CLOCK_IN. */
export function deriveClockedIn(sortedPunchesAsc: PunchDto[]): boolean {
  if (sortedPunchesAsc.length === 0) return false;
  const last = sortedPunchesAsc[sortedPunchesAsc.length - 1];
  return last.kind === "CLOCK_IN";
}
