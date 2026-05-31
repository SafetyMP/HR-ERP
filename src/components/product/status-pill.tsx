import { cn } from "@/lib/utils";

type Variant = "success" | "neutral" | "warning";

type Props = {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
};

const variants: Record<Variant, string> = {
  success: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
  neutral: "bg-muted text-muted-foreground",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
};

export function StatusPill({ variant, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
