import { describe, expect, it, beforeEach, afterEach } from "vitest";

import { assertSafeDeliveryUrl } from "@/lib/integrations/http/assert-safe-delivery-url";

describe("assertSafeDeliveryUrl", () => {
  const prev = process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST;

  beforeEach(() => {
    delete process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST;
    else process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST = prev;
  });

  it("accepts https public hosts", () => {
    const url = assertSafeDeliveryUrl("https://partner.example.com/hooks");
    expect(url.hostname).toBe("partner.example.com");
  });

  it("rejects http", () => {
    expect(() => assertSafeDeliveryUrl("http://partner.example.com/x")).toThrow(
      /must_be_https/,
    );
  });

  it("rejects private IPv4", () => {
    expect(() => assertSafeDeliveryUrl("https://10.0.0.8/x")).toThrow(
      /private_host/,
    );
    expect(() => assertSafeDeliveryUrl("https://169.254.169.254/latest")).toThrow(
      /private_host/,
    );
  });

  it("rejects IPv4-mapped IPv6 private addresses", () => {
    expect(() => assertSafeDeliveryUrl("https://[::ffff:10.0.0.8]/x")).toThrow(
      /private_host|host_blocked/,
    );
  });

  it("enforces allowlist when set", () => {
    process.env.INTEGRATION_DELIVERY_HOST_ALLOWLIST = "hooks.ok.example";
    expect(() => assertSafeDeliveryUrl("https://evil.example/x")).toThrow(
      /not_allowlisted/,
    );
    expect(() =>
      assertSafeDeliveryUrl("https://hooks.ok.example/path"),
    ).not.toThrow();
  });
});
