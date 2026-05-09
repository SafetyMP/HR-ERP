/**
 * Lightweight counters for integration operations (swap for OTel/Prometheus in production).
 */
const counts = new Map<string, number>();

export function integrationMetricInc(name: string, by = 1): void {
  counts.set(name, (counts.get(name) ?? 0) + by);
}

export function integrationMetricSnapshot(): Record<string, number> {
  return Object.fromEntries(counts.entries());
}
