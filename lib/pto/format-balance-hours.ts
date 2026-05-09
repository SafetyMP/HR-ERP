/** HR-facing hours display for PTO balance rows (Feature 005). */
export function formatBalanceHoursDisplay(hours: number): string {
  if (!Number.isFinite(hours)) return "0";
  const rounded = Math.round(hours * 100) / 100;
  const fmt = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return fmt.format(rounded);
}
