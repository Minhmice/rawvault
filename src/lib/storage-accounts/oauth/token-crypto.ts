import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { ApiError } from "@/lib/api/errors";

const ENCRYPTED_SECRET_VERSION = "rv1";

function parseEncryptionKey(rawKey: string): Buffer | null {
  const fromBase64 = Buffer.from(rawKey, "base64");
  if (fromBase64.length === 32) {
    return fromBase64;
  }

  const fromHex = Buffer.from(rawKey, "hex");
  if (fromHex.length === 32) {
    return fromHex;
  }

  return null;
}

function getEncryptionKey(): Buffer {
  const rawKey = process.env.RAWVAULT_TOKEN_ENCRYPTION_KEY;
  if (!rawKey) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "Missing required environment variable: RAWVAULT_TOKEN_ENCRYPTION_KEY",
    );
  }

  const key = parseEncryptionKey(rawKey);
  if (!key) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "RAWVAULT_TOKEN_ENCRYPTION_KEY must decode to 32 bytes (base64 or hex).",
    );
  }

  return key;
}

export function encryptProviderToken(token: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(token, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTED_SECRET_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

/**
 * Decrypt a provider token. Server-only. Never serialize result to client.
 */
export function decryptProviderToken(encrypted: string): string {
  if (!encrypted || typeof encrypted !== "string") {
    throw new ApiError(
      400,
      "TOKEN_DECRYPT_FAILED",
      "Encrypted token is empty or invalid.",
    );
  }

  const parts = encrypted.split(":");
  if (parts.length !== 4 || parts[0] !== ENCRYPTED_SECRET_VERSION) {
    throw new ApiError(
      400,
      "TOKEN_DECRYPT_FAILED",
      "Encrypted token format is invalid.",
    );
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(parts[1], "base64url");
  const authTag = Buffer.from(parts[2], "base64url");
  const ciphertext = Buffer.from(parts[3], "base64url");

  if (iv.length !== 12 || authTag.length !== 16) {
    throw new ApiError(400, "TOKEN_DECRYPT_FAILED", "Encrypted token parts are invalid.");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf-8");
  } catch {
    throw new ApiError(400, "TOKEN_DECRYPT_FAILED", "Token decryption failed.");
  }
}

export function assertProviderTokenEncryptionReady(): void {
  getEncryptionKey();
}

