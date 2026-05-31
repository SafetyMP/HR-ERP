"use client";

import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

import { meQueryKeys } from "@/lib/ess/me-query-keys";

type LifeEventRow = { status: string };

type LifeEventsResponse = {
  data?: { events?: LifeEventRow[] };
};

export function useBenefitsLifeEventsQuery() {
  return useAuthenticatedResource(
    meQueryKeys.benefitsLifeEvents,
    "/api/v1/me/benefits/life-events",
    async (res) => {
      const body = (await res.json()) as LifeEventsResponse;
      return body.data?.events ?? [];
    },
  );
}
