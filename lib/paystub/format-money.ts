export function formatMoneyMinor(amountMinor: number, currencyCode: string): string {
  const decimals = 2;
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(major);
  } catch {
    return `${currencyCode} ${major.toFixed(decimals)}`;
  }
}
