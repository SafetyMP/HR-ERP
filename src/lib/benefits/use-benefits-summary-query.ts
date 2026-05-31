"use client";

import type { BenefitsSummaryApiShape } from "@/lib/benefits/benefits-summary-types";
import { meQueryKeys } from "@/lib/ess/me-query-keys";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type BenefitsSummaryResponse = {
  data?: { benefitsSummary: BenefitsSummaryApiShape };
};

export function useBenefitsSummaryQuery() {
  return useAuthenticatedResource(
    meQueryKeys.benefitsSummary,
    "/api/v1/me/benefits/summary",
    async (res) => {
      const body = (await res.json()) as BenefitsSummaryResponse;
      return body.data?.benefitsSummary ?? null;
    },
  );
}
