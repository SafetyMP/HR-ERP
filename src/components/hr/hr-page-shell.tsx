"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** @deprecated Use `hr/layout` AppShell sidebar; this wrapper only adds optional page spacing. */
type Props = {
  children: ReactNode;
  activePath?: string;
  onReload?: () => void;
  onSignOut?: () => void;
  className?: string;
};

export function HrPageShell({ children, className }: Props) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}
