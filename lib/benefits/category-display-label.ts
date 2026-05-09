import type { BenefitCategory } from "@/app/generated/prisma/client";

export function benefitCategoryDisplayLabel(category: BenefitCategory): string {
  switch (category) {
    case "MEDICAL":
      return "Medical";
    case "DENTAL":
      return "Dental";
    case "VISION":
      return "Vision";
    case "INCOME_PROTECTION":
      return "Income protection";
    case "RETIREMENT":
      return "Retirement";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}
