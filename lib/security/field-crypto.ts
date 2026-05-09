import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

/**
 * Application-level AES-256-GCM envelope for highly sensitive columns (SSN, bank tokens).
 * Root keys remain in KMS/HSM in production — this provider is intentionally narrow.
 */
export interface DataKeyProvider {
  /** Returns 32-byte AES key material for `keyVersion`. */
  getAes256Key(keyVersion: string): Promise<Buffer>;
}

export interface CiphertextBlob {
  keyVersion: string;
  ivBase64: string;
  ciphertextBase64: string;
  tagBase64: string;
}

const ALGO = "aes-256-gcm";
const IV_LEN = 12;

export async function sealWithAes256Gcm(
  plaintextUtf8: string,
  keyVersion: string,
  keys: DataKeyProvider,
): Promise<CiphertextBlob> {
  const key = await keys.getAes256Key(keyVersion);
  if (key.length !== 32) {
    throw new Error("AES-256 requires 32-byte key material");
  }
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintextUtf8, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    keyVersion,
    ivBase64: iv.toString("base64"),
    ciphertextBase64: ciphertext.toString("base64"),
    tagBase64: tag.toString("base64"),
  };
}

export async function openWithAes256Gcm(
  blob: CiphertextBlob,
  keys: DataKeyProvider,
): Promise<string> {
  const key = await keys.getAes256Key(blob.keyVersion);
  const iv = Buffer.from(blob.ivBase64, "base64");
  const ciphertext = Buffer.from(blob.ciphertextBase64, "base64");
  const tag = Buffer.from(blob.tagBase64, "base64");
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** Dev-only provider — reads hex-encoded 32-byte key from env `FIELD_ENCRYPTION_KEY_<VERSION>`. */
export class EnvDevDataKeyProvider implements DataKeyProvider {
  async getAes256Key(keyVersion: string): Promise<Buffer> {
    const envName = `FIELD_ENCRYPTION_KEY_${keyVersion}`;
    const hex = process.env[envName];
    if (!hex || hex.length !== 64) {
      throw new Error(`${envName} must be 64 hex chars (32 bytes)`);
    }
    return Buffer.from(hex, "hex");
  }
}
