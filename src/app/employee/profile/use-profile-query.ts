"use client";

import { useAuthenticatedResource } from "@/lib/hooks/use-authenticated-resource";

export type ProfileEnvelope = {
  profile: {
    preferredName: string | null;
    personalEmail: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
};

export function useProfileQuery() {
  return useAuthenticatedResource(
    ["me", "profile"],
    "/api/v1/me/profile",
    async (res) => {
      const body = (await res.json()) as { data?: ProfileEnvelope };
      if (!body.data) throw new Error("profile_missing");
      return body.data;
    },
  );
}
