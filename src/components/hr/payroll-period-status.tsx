import { Badge } from "@/components/ui/badge";

export type PayrollPeriodStatusValue =
  | "OPEN"
  | "COMPUTED"
  | "LOCKED"
  | "ARTIFACT_GENERATED"
  | string;

const CONFIG: Record<
  string,
  { label: string; variant: "muted" | "warning" | "success" | "secondary" }
> = {
  OPEN: { label: "Open", variant: "muted" },
  COMPUTED: { label: "Computed — ready to lock", variant: "warning" },
  LOCKED: { label: "Locked", variant: "success" },
  ARTIFACT_GENERATED: { label: "Filing package generated", variant: "success" },
};

type Props = {
  status: PayrollPeriodStatusValue;
  className?: string;
};

export function PayrollPeriodStatusBadge({ status, className }: Props) {
  const cfg = CONFIG[status] ?? { label: status, variant: "muted" as const };
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  );
}
