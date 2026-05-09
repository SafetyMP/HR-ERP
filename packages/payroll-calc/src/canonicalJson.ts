import { createHash } from "node:crypto";

export function stableStringify(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export function sha256Hex(inputUtf8: string): string {
  return createHash("sha256").update(inputUtf8, "utf8").digest("hex");
}

function canonicalize(value: unknown): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "boolean") return value;
  if (t === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("stableStringify: non-finite numbers are not supported");
    }
    return value;
  }
  if (typeof value === "bigint") {
    return { __tag: "bigint", v: value.toString(10) };
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (t === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      out[k] = canonicalize(record[k]);
    }
    return out;
  }
  throw new TypeError(`stableStringify: unsupported type ${t}`);
}
