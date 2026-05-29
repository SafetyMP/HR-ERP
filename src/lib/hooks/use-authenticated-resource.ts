"use client";

import type { QueryKey, UseQueryOptions } from "@tanstack/react-query";

import { useHrQuery } from "@/lib/hooks/use-hr-query";

type JsonFetcher<T> = (res: Response) => Promise<T>;

/**
 * Standard v1 API read: waits for HR access, fetches JSON with bearer token.
 */
export function useAuthenticatedResource<T>(
  key: QueryKey,
  path: string,
  parse: JsonFetcher<T>,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, "queryKey" | "queryFn">,
) {
  return useHrQuery(key, path, parse, options);
}
