import type { QueryClient } from "@tanstack/react-query";

import { getBenefitsSummary } from "@/lib/benefits/get-benefits-summary";
import { listMyBenefitLifeEvents } from "@/lib/benefits/benefit-life-events";
import { getTodayAttendanceSummary } from "@/lib/attendance/get-today-attendance-summary";
import { getServerSessionAuth } from "@/lib/ess/server-session-auth";
import { getCurrentPaystub } from "@/lib/paystub/get-current-paystub";
import { getPtoSummary } from "@/lib/pto/get-pto-summary";
import { getMyProfile } from "@/lib/profile/get-my-profile";
import { getRoutePolicy } from "@/lib/security/route-policies";

import { meQueryKeys } from "./me-query-keys";

const ESS_PREFETCH_ROUTES = {
  paystub: "/api/v1/me/paystub/current",
  benefits: "/api/v1/me/benefits/summary",
  benefitsLifeEvents: "/api/v1/me/benefits/life-events",
  pto: "/api/v1/me/pto/summary",
  attendance: "/api/v1/me/attendance/today",
  profile: "/api/v1/me/profile",
} as const;

async function prefetchPaystub(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  const policy = getRoutePolicy("GET", ESS_PREFETCH_ROUTES.paystub)!;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.paystubCurrent,
    queryFn: async () =>
      getCurrentPaystub(auth, {
        permission: policy.permission,
        abac: policy.abac,
      }),
  });
}

async function prefetchBenefitsSummary(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.benefitsSummary,
    queryFn: async () => getBenefitsSummary(auth),
  });
}

async function prefetchBenefitsLifeEvents(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.benefitsLifeEvents,
    queryFn: async () => {
      const events = await listMyBenefitLifeEvents(auth);
      return events;
    },
  });
}

async function prefetchPtoSummary(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.ptoSummary,
    queryFn: async () => getPtoSummary(auth),
  });
}

async function prefetchAttendanceToday(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.attendanceToday,
    queryFn: async () => getTodayAttendanceSummary(auth),
  });
}

async function prefetchProfile(queryClient: QueryClient) {
  const auth = await getServerSessionAuth();
  if (!auth) return;
  const policy = getRoutePolicy("GET", ESS_PREFETCH_ROUTES.profile)!;
  await queryClient.prefetchQuery({
    queryKey: meQueryKeys.profile,
    queryFn: async () =>
      getMyProfile(auth, {
        permission: policy.permission,
        abac: policy.abac,
      }),
  });
}

export async function prefetchEssPaystubPage(queryClient: QueryClient) {
  await prefetchPaystub(queryClient);
}

export async function prefetchEssBenefitsPage(queryClient: QueryClient) {
  await Promise.all([
    prefetchBenefitsSummary(queryClient),
    prefetchBenefitsLifeEvents(queryClient),
  ]);
}

export async function prefetchEssPtoPage(queryClient: QueryClient) {
  await prefetchPtoSummary(queryClient);
}

export async function prefetchEssTimePage(queryClient: QueryClient) {
  await prefetchAttendanceToday(queryClient);
}

export async function prefetchEssProfilePage(queryClient: QueryClient) {
  await prefetchProfile(queryClient);
}

/** Employee home — pay, time, PTO, benefits snapshot. */
export async function prefetchEssHomePage(queryClient: QueryClient) {
  await Promise.all([
    prefetchPaystub(queryClient),
    prefetchPtoSummary(queryClient),
    prefetchAttendanceToday(queryClient),
    prefetchBenefitsSummary(queryClient),
  ]);
}
