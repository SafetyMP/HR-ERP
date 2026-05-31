"use client";

import type { PaystubApiShape } from "@/lib/paystub/paystub-api-types";
import { meQueryKeys } from "@/lib/ess/me-query-keys";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type PaystubResponse = {
  data?: { paystub: PaystubApiShape | null };
};

export function useCurrentPaystubQuery() {
  return useAuthenticatedResource(
    meQueryKeys.paystubCurrent,
    "/api/v1/me/paystub/current",
    async (res) => {
      const body = (await res.json()) as PaystubResponse;
      return body.data?.paystub ?? null;
    },
  );
}
