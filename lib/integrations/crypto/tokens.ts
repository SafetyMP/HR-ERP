import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALG = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SCRYPT_PREFIX = "v2.";

export type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAtIso: string;
};

function scryptSalt(): Buffer {
  const raw = (process.env.INTEGRATION_SECRET_SALT ?? "").trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("INTEGRATION_SECRET_SALT is required in production");
    }
    return Buffer.from("hr-erp-integration-v2", "utf8");
  }
  return Buffer.from(raw, "utf8");
}

function deriveKeyV1(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

function deriveKeyV2(secret: string): Buffer {
  return scryptSync(secret, scryptSalt(), 32, { N: 16384, r: 8, p: 1 });
}

function seal(key: Buffer, bundle: TokenBundle): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALG, key, iv);
  const plaintext = Buffer.from(JSON.stringify(bundle), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

function open(key: Buffer, ciphertext: string): TokenBundle {
  const raw = Buffer.from(ciphertext, "base64url");
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as TokenBundle;
}

export function encryptTokenBundle(
  secret: string,
  bundle: TokenBundle,
): string {
  return SCRYPT_PREFIX + seal(deriveKeyV2(secret), bundle);
}

export function decryptTokenBundle(
  secret: string,
  ciphertext: string,
): TokenBundle {
  if (ciphertext.startsWith(SCRYPT_PREFIX)) {
    return open(deriveKeyV2(secret), ciphertext.slice(SCRYPT_PREFIX.length));
  }
  // Legacy SHA-256 derived keys (pre-audit).
  return open(deriveKeyV1(secret), ciphertext);
}

export function getIntegrationSecret(): string {
  const s = process.env.INTEGRATION_SECRET_KEY;
  if (!s) throw new Error("INTEGRATION_SECRET_KEY is not set");
  return s;
}
