import * as React from "react";

import { cn } from "@/lib/utils";

function Alert({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50",
        className,
      )}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-zinc-600 dark:text-zinc-400", className)} {...props} />
  );
}

export { Alert, AlertDescription, AlertTitle };
