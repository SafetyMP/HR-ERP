"use client";

import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";

import { hrApiFetch } from "@/lib/auth/hr-api-fetch";
import { useHrAccess } from "@/lib/auth/use-hr-access";

type JsonFetcher<T> = (res: Response) => Promise<T>;

export function useHrQuery<T>(
  key: QueryKey,
  path: string,
  parse: JsonFetcher<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">,
) {
  const { bearerToken, isAuthenticated, ready } = useHrAccess();

  return useQuery({
    queryKey: key,
    enabled: ready && isAuthenticated && (options?.enabled ?? true),
    ...options,
    queryFn: async () => {
      const res = await hrApiFetch(path, {
        bearerToken,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? `Request failed (${res.status})`);
      }
      return parse(res);
    },
  });
}
