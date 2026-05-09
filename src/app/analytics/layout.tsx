import type { ReactNode } from "react";

/** These routes read Postgres at request time; skip static prerender during `next build`. */
export const dynamic = "force-dynamic";

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-background text-foreground antialiased selection:bg-primary/25 selection:text-foreground">
      {children}
    </div>
  );
}
