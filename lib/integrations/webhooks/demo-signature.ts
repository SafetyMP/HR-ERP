import { timingSafeEqual, createHmac } from "node:crypto";

export function verifyDemoWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expectedHex = signatureHeader.slice("sha256=".length);
  let expected: Buffer;
  try {
    expected = Buffer.from(expectedHex, "hex");
  } catch {
    return false;
  }

  const mac = createHmac("sha256", secret);
  mac.update(rawBody);
  const actual = mac.digest();

  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export function getDemoWebhookSecret(): string {
  const s = process.env.DEMO_WEBHOOK_SECRET;
  if (!s) throw new Error("DEMO_WEBHOOK_SECRET is not set");
  return s;
}
