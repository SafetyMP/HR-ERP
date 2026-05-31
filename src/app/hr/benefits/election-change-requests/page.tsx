import type { Metadata } from "next";

import { redirectDevJwtToSession } from "@/lib/auth/redirect-dev-jwt";

import { HrElectionChangeRequestsClient } from "./hr-election-change-requests-client";

export const metadata: Metadata = {
  title: "Election change requests",
  description: "Review pending employee benefit election change intents",
};

type Props = {
  searchParams?: Promise<{ devJwt?: string }>;
};

export default async function HrElectionChangeRequestsPage(props: Props) {
  const sp = props.searchParams ? await props.searchParams : {};
  redirectDevJwtToSession(sp.devJwt, "/hr/benefits/election-change-requests");

  return <HrElectionChangeRequestsClient />;
}
