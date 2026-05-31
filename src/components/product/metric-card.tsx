import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  accent?: "default" | "success" | "warning" | "muted";
  className?: string;
};

const accentStyles = {
  default: "border-border bg-card",
  success: "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20",
  warning: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20",
  muted: "border-border bg-muted/30",
} as const;

export function MetricCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
  accent = "default",
  className,
}: Props) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </div>
      {detail ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
      ) : null}
    </>
  );

  const classes = cn(
    "block rounded-xl border p-5 shadow-sm transition-colors",
    href && "hover:border-primary/35 hover:bg-accent/20",
    accentStyles[accent],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {inner}
      </Link>
    );
  }

  return <div className={classes}>{inner}</div>;
}
