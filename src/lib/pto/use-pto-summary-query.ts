"use client";

import type { PtoSummaryApiShape } from "@/lib/pto/pto-summary-types";
import { meQueryKeys } from "@/lib/ess/me-query-keys";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type PtoSummaryResponse = {
  data?: { ptoSummary: PtoSummaryApiShape };
};

export function usePtoSummaryQuery() {
  return useAuthenticatedResource(
    meQueryKeys.ptoSummary,
    "/api/v1/me/pto/summary",
    async (res) => {
      const body = (await res.json()) as PtoSummaryResponse;
      return body.data?.ptoSummary ?? null;
    },
  );
}
