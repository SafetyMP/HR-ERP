"use client";

import type { PtoSummaryApiShape } from "@/lib/pto/pto-summary-types";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type PtoSummaryResponse = {
  data?: { ptoSummary: PtoSummaryApiShape };
};

export function usePtoSummaryQuery() {
  return useAuthenticatedResource(
    ["me", "pto", "summary"],
    "/api/v1/me/pto/summary",
    async (res) => {
      const body = (await res.json()) as PtoSummaryResponse;
      return body.data?.ptoSummary ?? null;
    },
  );
}
