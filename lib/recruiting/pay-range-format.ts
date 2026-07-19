export function formatPayRangeLabel(input: {
  payRangeMin: unknown;
  payRangeMax: unknown;
  payRangeCurrency: string | null | undefined;
}): string | null {
  const min =
    input.payRangeMin === null || input.payRangeMin === undefined
      ? null
      : Number(input.payRangeMin);
  const max =
    input.payRangeMax === null || input.payRangeMax === undefined
      ? null
      : Number(input.payRangeMax);
  if (min === null && max === null) return null;
  if (min !== null && !Number.isFinite(min)) return null;
  if (max !== null && !Number.isFinite(max)) return null;
  const currency = (input.payRangeCurrency ?? "USD").toUpperCase();
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (min !== null && max !== null) return `${fmt(min)} – ${fmt(max)}`;
  if (min !== null) return `From ${fmt(min)}`;
  if (max !== null) return `Up to ${fmt(max)}`;
  return null;
}
