"use client";

import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

export type PaystubHistoryItem = {
  periodId: string;
  payDate: string;
  grossMinor: number;
  netMinor: number;
  currencyCode: string;
};

type PaystubHistoryResponse = {
  data?: { paystubHistory: PaystubHistoryItem[] };
};

export function usePaystubHistoryQuery() {
  return useAuthenticatedResource(
    ["me", "paystub", "history"],
    "/api/v1/me/paystub/history",
    async (res) => {
      const body = (await res.json()) as PaystubHistoryResponse;
      return body.data?.paystubHistory ?? [];
    },
  );
}
