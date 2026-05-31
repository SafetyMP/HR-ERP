export type BenefitEnrollmentApiItem = {
  category: string;
  categoryLabel: string;
  planLabel: string;
  carrierName: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  dependentCount: number | null;
  electiveDeferralPercent: number | null;
};

export type BenefitsSummaryApiShape = {
  calendarBasis: string;
  enrollments: BenefitEnrollmentApiItem[];
};
