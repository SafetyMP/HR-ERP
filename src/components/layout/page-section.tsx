import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function PageSection({ title, description, children, className }: Props) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      {title ? (
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
