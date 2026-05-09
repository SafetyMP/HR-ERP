import type { BenefitCategory } from "@/app/generated/prisma/client";

/** Display section order per Feature brief (Medical → Retirement). */
export const BENEFIT_CATEGORY_SORT_ORDER: readonly BenefitCategory[] = [
  "MEDICAL",
  "DENTAL",
  "VISION",
  "INCOME_PROTECTION",
  "RETIREMENT",
] as const;

export function compareBenefitCategories(a: BenefitCategory, b: BenefitCategory): number {
  return BENEFIT_CATEGORY_SORT_ORDER.indexOf(a) - BENEFIT_CATEGORY_SORT_ORDER.indexOf(b);
}
