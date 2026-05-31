"use client";

import type { MyProfileEnvelope } from "@/lib/profile/employee-self-profile-mapper";
import { meQueryKeys } from "@/lib/ess/me-query-keys";
import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

type ProfileResponse = {
  data?: MyProfileEnvelope;
};

export function useProfileQuery() {
  return useAuthenticatedResource(
    meQueryKeys.profile,
    "/api/v1/me/profile",
    async (res) => {
      const body = (await res.json()) as ProfileResponse;
      if (!body.data) throw new Error("profile_missing");
      return body.data;
    },
  );
}

export type { MyProfileEnvelope };
