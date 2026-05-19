import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const PREFIX = "enc:v1:";

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function getWebhookEncryptionKey(): string {
  const key =
    process.env.WEBHOOK_ENCRYPTION_KEY?.trim() ||
    process.env.INTEGRATION_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "WEBHOOK_ENCRYPTION_KEY or INTEGRATION_SECRET_KEY must be set for webhook secret encryption",
    );
  }
  return key;
}

export function isEncryptedWebhookSecret(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/**
 * Encrypt a plaintext webhook HMAC secret for persistence.
 */
export function encryptWebhookSecret(plaintext: string): string {
  const key = deriveKey(getWebhookEncryptionKey());
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALG, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const blob = Buffer.concat([iv, tag, enc]).toString("base64url");
  return `${PREFIX}${blob}`;
}

/**
 * Decrypt a stored webhook secret. Plaintext values (legacy) pass through unchanged.
 */
export function decryptWebhookSecret(stored: string): string {
  if (!isEncryptedWebhookSecret(stored)) {
    return stored;
  }
  const key = deriveKey(getWebhookEncryptionKey());
  const raw = Buffer.from(stored.slice(PREFIX.length), "base64url");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
