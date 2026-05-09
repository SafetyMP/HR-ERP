import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAtIso: string;
};

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptTokenBundle(
  secret: string,
  bundle: TokenBundle,
): string {
  const key = deriveKey(secret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALG, key, iv);
  const plaintext = Buffer.from(JSON.stringify(bundle), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

export function decryptTokenBundle(
  secret: string,
  ciphertext: string,
): TokenBundle {
  const key = deriveKey(secret);
  const raw = Buffer.from(ciphertext, "base64url");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  const parsed = JSON.parse(plain.toString("utf8")) as TokenBundle;
  return parsed;
}

export function getIntegrationSecret(): string {
  const s = process.env.INTEGRATION_SECRET_KEY;
  if (!s) throw new Error("INTEGRATION_SECRET_KEY is not set");
  return s;
}
