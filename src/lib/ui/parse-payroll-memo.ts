export function parseMemoFingerprint(memo: string | null): string | null {
  if (!memo) return null;
  try {
    const parsed = JSON.parse(memo) as { fingerprint?: string };
    return typeof parsed.fingerprint === "string" ? parsed.fingerprint : null;
  } catch {
    return null;
  }
}
