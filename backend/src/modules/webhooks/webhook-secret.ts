import crypto from "node:crypto";
import { env } from "../../config/env.js";

const PREFIX = "enc:v1:";

function key() {
  return Buffer.from(env.WEBHOOK_SECRET_ENCRYPTION_KEY, "hex");
}

export function encryptWebhookSecret(secret: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptWebhookSecret(value: string) {
  if (!value.startsWith(PREFIX)) return value;
  const encoded = value.slice(PREFIX.length).split(".");
  if (encoded.length !== 3) throw new Error("WEBHOOK_SECRET_INVALID");
  const [ivEncoded, tagEncoded, ciphertextEncoded] = encoded;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(ivEncoded, "base64url"));
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("WEBHOOK_SECRET_INVALID");
  }
}
