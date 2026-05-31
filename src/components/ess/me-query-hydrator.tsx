"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";

type Props = {
  state: DehydratedState;
  children: React.ReactNode;
};

export function MeQueryHydrator({ state, children }: Props) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
}
