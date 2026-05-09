import type { BenefitCategory } from "@/app/generated/prisma/client";

import { ApiError } from "@/lib/api/v1/errors";
import { compareBenefitCategories } from "@/lib/benefits/category-order";
import { benefitCategoryDisplayLabel } from "@/lib/benefits/category-display-label";
import { isBenefitEnrollmentActiveOn } from "@/lib/benefits/is-benefit-enrollment-active";
import { utcCalendarDateString } from "@/lib/benefits/utc-calendar-date";
import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/lib/security/auth-context";
import { withAuthorizedTransaction } from "@/lib/security/with-authorized-transaction";

export type BenefitEnrollmentItemPayload = {
  category: BenefitCategory;
  categoryLabel: string;
  planLabel: string;
  carrierName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  dependentCount: number | null;
  /** Whole-percent elective deferral when category is RETIREMENT (basis points / 100); otherwise null. */
  electiveDeferralPercent: number | null;
};

export type BenefitsSummaryPayload = {
  calendarBasis: "UTC";
  enrollments: BenefitEnrollmentItemPayload[];
};

function electiveDeferralPercentFromBasisPoints(basisPoints: number | null): number | null {
  if (basisPoints === null || basisPoints === undefined) return null;
  return Math.round(basisPoints) / 100;
}

export async function getBenefitsSummary(auth: AuthContext): Promise<BenefitsSummaryPayload> {
  const employeeId = auth.subjectEmployeeId;
  if (!employeeId) {
    throw new ApiError(403, {
      code: "forbidden",
      message: "employee_context_required",
    });
  }

  const asOfUtcDate = utcCalendarDateString(new Date());

  return withAuthorizedTransaction(
    prisma,
    auth,
    {
      permission: "benefits:read",
      abac: { minMfa: "standard", maxDataClassification: "confidential" },
    },
    async (tx) => {
      const rows = await tx.benefitEnrollment.findMany({
        where: { tenantId: auth.tenantId, employeeId },
        orderBy: [{ effectiveFrom: "desc" }, { planLabel: "asc" }],
      });

      const active = rows.filter((r) =>
        isBenefitEnrollmentActiveOn(r.effectiveFrom, r.effectiveTo, asOfUtcDate),
      );

      active.sort((a, b) => {
        const byCat = compareBenefitCategories(a.category, b.category);
        if (byCat !== 0) return byCat;
        const af = a.effectiveFrom.getTime();
        const bf = b.effectiveFrom.getTime();
        if (af !== bf) return bf - af;
        return a.planLabel.localeCompare(b.planLabel);
      });

      const enrollments: BenefitEnrollmentItemPayload[] = active.map((r) => ({
        category: r.category,
        categoryLabel: benefitCategoryDisplayLabel(r.category),
        planLabel: r.planLabel,
        carrierName: r.carrierName,
        effectiveFrom: utcCalendarDateString(r.effectiveFrom),
        effectiveTo: r.effectiveTo ? utcCalendarDateString(r.effectiveTo) : null,
        dependentCount: r.dependentCount,
        electiveDeferralPercent:
          r.category === "RETIREMENT"
            ? electiveDeferralPercentFromBasisPoints(r.retirementDeferralBasisPoints)
            : null,
      }));

      return { calendarBasis: "UTC", enrollments };
    },
  );
}
