import { describe, expect, it } from "vitest";

import { verifySignature } from "@/lib/webhooks/signing";
import { deliverWebhookHttp } from "@/lib/webhooks/deliver-http";

describe("webhook delivery", () => {
  it("deliverWebhookHttp signs body verifiable by subscriber", async () => {
    const secret = "a".repeat(32);
    let capturedHeader = "";
    let capturedBody = "";

    const mockFetch: typeof fetch = async (_url, init) => {
      capturedHeader = String(
        (init?.headers as Record<string, string>)["X-HRERP-Signature-256"],
      );
      capturedBody = String(init?.body);
      return new Response("ok", { status: 200 });
    };

    const result = await deliverWebhookHttp(
      {
        deliveryId: "del-1",
        targetUrl: "https://example.com/hooks/hr",
        secret,
        eventType: "payroll.pay_run.computed",
        payload: { computed: 3 },
        signatureHex: "unused",
      },
      mockFetch,
    );

    expect(result.ok).toBe(true);
    expect(verifySignature(capturedHeader, JSON.parse(capturedBody), secret)).toBe(
      true,
    );
  });
});
