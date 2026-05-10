import { describe, expect, it } from "vitest";

import {
  canonicalJson,
  signWebhookPayload,
  verifySignature,
} from "@/lib/webhooks/signing";

const SECRET = "supersecret-must-be-32-chars-or-more!!!";

describe("canonicalJson", () => {
  it("sorts object keys lexicographically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("recurses into nested objects and arrays", () => {
    const out = canonicalJson({
      z: { y: [1, { b: 1, a: 2 }] },
      a: null,
    });
    expect(out).toBe('{"a":null,"z":{"y":[1,{"a":2,"b":1}]}}');
  });

  it("drops undefined and function fields like JSON.stringify", () => {
    expect(canonicalJson({ a: undefined, b: () => 1, c: 2 })).toBe('{"c":2}');
  });

  it("encodes bigint as a string to avoid precision loss", () => {
    expect(canonicalJson({ n: 9007199254740993n })).toBe('{"n":"9007199254740993"}');
  });
});

describe("signWebhookPayload + verifySignature", () => {
  const fixedTs = "2026-05-09T20:00:00.000Z";
  const fixedNow = () => new Date(fixedTs);

  it("produces deterministic signatures for equivalent payloads", () => {
    const a = signWebhookPayload({ a: 1, b: 2 }, SECRET, fixedTs);
    const b = signWebhookPayload({ b: 2, a: 1 }, SECRET, fixedTs);
    expect(a.hex).toBe(b.hex);
    expect(a.header).toContain("v1,t=2026-05-09T20:00:00.000Z");
  });

  it("verifies a freshly signed payload", () => {
    const sig = signWebhookPayload({ hello: "world" }, SECRET, fixedTs);
    expect(
      verifySignature(sig.header, { hello: "world" }, SECRET, { now: fixedNow }),
    ).toBe(true);
  });

  it("rejects tampered payloads", () => {
    const sig = signWebhookPayload({ amount: 100 }, SECRET, fixedTs);
    expect(
      verifySignature(sig.header, { amount: 999 }, SECRET, { now: fixedNow }),
    ).toBe(false);
  });

  it("rejects signatures outside the replay window", () => {
    const old = signWebhookPayload({ x: 1 }, SECRET, "2024-01-01T00:00:00.000Z");
    expect(verifySignature(old.header, { x: 1 }, SECRET, { now: fixedNow })).toBe(
      false,
    );
  });

  it("rejects malformed signature headers", () => {
    expect(verifySignature("garbage", { x: 1 }, SECRET)).toBe(false);
    expect(verifySignature("v1,t=,mac=abc", { x: 1 }, SECRET)).toBe(false);
  });
});
