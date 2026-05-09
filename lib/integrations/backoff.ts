/**
 * Exponential backoff with full jitter (AWS-style).
 * @see https://aws.amazon.com/blogs/architecture/exponential-back-off-and-jitter/
 */
export function backoffMs(attempt: number, baseMs: number, capMs: number): number {
  const exp = Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.floor(Math.random() * exp);
}

export function parseRetryAfterHeader(
  value: string | null,
): number | undefined {
  if (!value) return undefined;
  const asInt = parseInt(value, 10);
  if (!Number.isNaN(asInt)) return asInt;
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) {
    const delta = Math.ceil((asDate - Date.now()) / 1000);
    return delta > 0 ? delta : undefined;
  }
  return undefined;
}
