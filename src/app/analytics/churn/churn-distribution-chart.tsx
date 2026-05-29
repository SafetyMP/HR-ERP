"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChurnRow {
  score: number;
}

const BUCKETS = [
  { key: "low", min: 0, max: 0.25, label: "Low (0.00–0.25)", fill: "hsl(var(--primary))" },
  { key: "moderate", min: 0.25, max: 0.5, label: "Moderate (0.25–0.50)", fill: "hsl(var(--muted-foreground))" },
  { key: "elevated", min: 0.5, max: 0.75, label: "Elevated (0.50–0.75)", fill: "hsl(var(--accent-foreground))" },
  { key: "high", min: 0.75, max: 1.001, label: "High (0.75–1.00)", fill: "hsl(var(--destructive))" },
] as const;

export function ChurnDistributionChart({ rows }: { rows: ChurnRow[] }) {
  const data = BUCKETS.map((bucket) => ({
    label: bucket.label,
    fill: bucket.fill,
    count: rows.filter((r) => r.score >= bucket.min && r.score < bucket.max).length,
  }));

  return (
    <div
      className="rounded-lg border border-border bg-card p-4 shadow-sm"
      role="img"
      aria-label="Histogram of latest flight-risk scores grouped into four buckets"
    >
      <h2 className="mb-2 text-sm font-semibold text-foreground">
        Score distribution
      </h2>
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        Calculated client-side from the {rows.length} most recent scores already permitted by
        RBAC + ABAC + RLS.
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,0.2)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            angle={-12}
            tickMargin={8}
            interval={0}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fillOpacity: 0.05 }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
