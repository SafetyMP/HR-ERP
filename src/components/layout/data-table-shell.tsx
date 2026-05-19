import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { EmptyState } from "./empty-state";

type Props = {
  loading?: boolean;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DataTableShell({
  loading,
  empty,
  emptyTitle = "No records",
  emptyDescription,
  emptyAction,
  children,
  className,
}: Props) {
  if (loading) {
    return (
      <div className={cn("space-y-2", className)} aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  if (empty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }
  return <div className={className}>{children}</div>;
}
