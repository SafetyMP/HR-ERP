import { createHash } from "node:crypto";

export function hashFilingPayload(payload: unknown): string {
  const canonical = JSON.stringify(payload);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
