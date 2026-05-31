import { cn } from "@/lib/utils";

type LineItem = {
  key: string;
  label: string;
  amount: string;
};

type Props = {
  title: string;
  items: LineItem[];
  emptyMessage?: string;
  className?: string;
};

export function MoneyLineSection({ title, items, emptyMessage, className }: Props) {
  return (
    <section className={cn("space-y-3", className)} aria-labelledby={`section-${title}`}>
      <h3
        id={`section-${title}`}
        className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage ?? "None this period."}</p>
      ) : (
        <ul className="overflow-hidden rounded-lg border border-border bg-background/60">
          {items.map((row, index) => (
            <li
              key={row.key}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3 text-sm",
                index > 0 && "border-t border-border",
              )}
            >
              <span className="text-foreground">{row.label}</span>
              <span className="shrink-0 tabular-nums font-medium text-foreground">{row.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type TotalsProps = {
  grossLabel?: string;
  grossAmount: string;
  netLabel?: string;
  netAmount: string;
};

export function MoneyTotals({
  grossLabel = "Gross pay",
  grossAmount,
  netLabel = "Net pay",
  netAmount,
}: TotalsProps) {
  return (
    <div className="rounded-xl border border-primary/20 bg-primary-muted/30 p-5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{grossLabel}</span>
        <span className="tabular-nums font-medium text-foreground">{grossAmount}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-4 border-t border-primary/15 pt-4">
        <span className="text-base font-semibold text-foreground">{netLabel}</span>
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
          {netAmount}
        </span>
      </div>
    </div>
  );
}
