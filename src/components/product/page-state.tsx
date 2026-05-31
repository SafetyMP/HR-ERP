import { Skeleton } from "@/components/ui/skeleton";

export function PageStateLoading({ label }: { label: string }) {
  return (
    <div className="space-y-4" aria-live="polite" aria-busy="true">
      <p className="sr-only">{label}</p>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-36 rounded-xl" />
      ))}
    </div>
  );
}
