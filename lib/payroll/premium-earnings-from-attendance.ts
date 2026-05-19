import type { Prisma } from "@/app/generated/prisma/client";

import {
  allocatePremiumHours,
  type PremiumGeoId,
  type PremiumPunchInput,
} from "@/lib/compliance/pay-premiums";

/** Matrix default for US-FED row — data-driven in production loaders. */
const US_FED_STANDARD_WEEKLY_HOURS = 40;

const STATE_TO_GEO: Record<string, PremiumGeoId> = {
  CA: "US-CA",
  NY: "US-NY",
  CO: "US-CO",
  TX: "US-TX",
};

export function resolvePremiumGeoId(
  jurisdictionCountry: string | null | undefined,
  workState: string | null | undefined,
): PremiumGeoId {
  if (jurisdictionCountry?.toUpperCase() !== "US") {
    return "US-FED";
  }
  const state = workState?.toUpperCase();
  if (state && state in STATE_TO_GEO) {
    return STATE_TO_GEO[state]!;
  }
  return "US-FED";
}

export async function loadPunchesForPayPeriod(
  tx: Prisma.TransactionClient,
  tenantId: string,
  employeeId: string,
  periodStart: Date,
  periodEndExclusive: Date,
): Promise<readonly PremiumPunchInput[]> {
  const rows = await tx.attendancePunch.findMany({
    where: {
      tenantId,
      employeeId,
      occurredAt: { gte: periodStart, lt: periodEndExclusive },
    },
    orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
    select: { kind: true, occurredAt: true },
  });
  return rows.map((r) => ({
    kind: r.kind as PremiumPunchInput["kind"],
    occurredAt: r.occurredAt,
  }));
}

export function computePremiumAllocationForPunches(args: {
  geoId: PremiumGeoId;
  punches: readonly PremiumPunchInput[];
  flsaExempt: boolean;
}) {
  return allocatePremiumHours({
    geoId: args.geoId,
    punches: args.punches,
    flsaExempt: args.flsaExempt,
    standardHoursForWeeklyOt: US_FED_STANDARD_WEEKLY_HOURS,
  });
}

export function isPremiumFromAttendanceEnabled(): boolean {
  return process.env.PAYROLL_PREMIUM_FROM_ATTENDANCE === "1";
}
