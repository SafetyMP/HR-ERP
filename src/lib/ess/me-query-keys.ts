/** Shared TanStack Query keys for `/api/v1/me/*` ESS reads (prefetch + client hooks). */
export const meQueryKeys = {
  paystubCurrent: ["me", "paystub", "current"] as const,
  benefitsSummary: ["me", "benefits", "summary"] as const,
  benefitsLifeEvents: ["me", "benefits", "life-events"] as const,
  ptoSummary: ["me", "pto", "summary"] as const,
  attendanceToday: ["me", "attendance", "today"] as const,
  profile: ["me", "profile"] as const,
};
