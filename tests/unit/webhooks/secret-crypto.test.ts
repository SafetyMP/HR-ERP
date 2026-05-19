import { afterEach, describe, expect, it } from "vitest";

import {
  decryptWebhookSecret,
  encryptWebhookSecret,
  isEncryptedWebhookSecret,
} from "@/lib/webhooks/secret-crypto";

describe("webhook secret-crypto", () => {
  const priorWebhook = process.env.WEBHOOK_ENCRYPTION_KEY;
  const priorIntegration = process.env.INTEGRATION_SECRET_KEY;

  afterEach(() => {
    if (priorWebhook === undefined) delete process.env.WEBHOOK_ENCRYPTION_KEY;
    else process.env.WEBHOOK_ENCRYPTION_KEY = priorWebhook;
    if (priorIntegration === undefined) delete process.env.INTEGRATION_SECRET_KEY;
    else process.env.INTEGRATION_SECRET_KEY = priorIntegration;
  });

  it("round-trips encrypt and decrypt", () => {
    process.env.WEBHOOK_ENCRYPTION_KEY = "test-webhook-encryption-key-32chars-min";
    const plain = "a".repeat(32);
    const enc = encryptWebhookSecret(plain);
    expect(isEncryptedWebhookSecret(enc)).toBe(true);
    expect(decryptWebhookSecret(enc)).toBe(plain);
  });

  it("passes through legacy plaintext secrets", () => {
    process.env.WEBHOOK_ENCRYPTION_KEY = "test-webhook-encryption-key-32chars-min";
    const plain = "legacy-plaintext-secret-32chars!!!!";
    expect(decryptWebhookSecret(plain)).toBe(plain);
    expect(isEncryptedWebhookSecret(plain)).toBe(false);
  });
});
