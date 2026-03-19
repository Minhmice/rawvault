import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";

const statePayloadSchema = z.object({
  provider: z.enum(["gdrive", "onedrive"]),
  userId: z.string().uuid(),
  returnTo: z.string().min(1).max(2048),
  iat: z.number().int().positive(),
  nonce: z.string().min(1),
});

const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const OAUTH_STATE_TOKEN_VERSION = "rvstate1";

function getStateSecret(): string {
  const secret = process.env.RAWVAULT_OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "Missing required environment variable: RAWVAULT_OAUTH_STATE_SECRET (min length 32).",
    );
  }
  return secret;
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function signLegacyPayload(encodedPayload: string): string {
  return createHmac("sha256", getStateSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function stateCipherKey(): Buffer {
  return createHash("sha256").update(getStateSecret()).digest();
}

function encryptStatePayload(payload: OAuthStatePayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", stateCipherKey(), iv);
  const plaintext = JSON.stringify(payload);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    OAUTH_STATE_TOKEN_VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function tryReadLegacyStateToken(state: string): unknown {
  const [encodedPayload, receivedSignature] = state.split(".");
  if (!encodedPayload || !receivedSignature) {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "Invalid OAuth state.");
  }

  const expectedSignature = signLegacyPayload(encodedPayload);
  const receivedBuffer = Buffer.from(receivedSignature, "utf-8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");

  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "Invalid OAuth state signature.");
  }

  try {
    return JSON.parse(fromBase64Url(encodedPayload));
  } catch {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "OAuth state payload is malformed.");
  }
}

function readEncryptedStateToken(state: string): unknown {
  const [version, encodedIv, encodedAuthTag, encodedCiphertext] = state.split(".");
  if (
    version !== OAUTH_STATE_TOKEN_VERSION ||
    !encodedIv ||
    !encodedAuthTag ||
    !encodedCiphertext
  ) {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "Invalid OAuth state.");
  }

  try {
    const iv = Buffer.from(encodedIv, "base64url");
    const authTag = Buffer.from(encodedAuthTag, "base64url");
    const ciphertext = Buffer.from(encodedCiphertext, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", stateCipherKey(), iv);
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
      "utf-8",
    );
    return JSON.parse(plaintext);
  } catch {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "OAuth state payload is invalid.");
  }
}

function normalizeReturnTo(returnTo?: string): string {
  if (!returnTo) {
    return "/";
  }
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }
  return returnTo;
}

export type OAuthStatePayload = z.infer<typeof statePayloadSchema>;

export function createOAuthStateToken(input: {
  provider: AccountProvider;
  userId: string;
  returnTo?: string;
}): string {
  const payload = statePayloadSchema.parse({
    provider: input.provider,
    userId: input.userId,
    returnTo: normalizeReturnTo(input.returnTo),
    iat: Math.floor(Date.now() / 1000),
    nonce: randomBytes(16).toString("base64url"),
  });

  return encryptStatePayload(payload);
}

export function verifyOAuthStateToken(
  state: string,
  expected: { provider: AccountProvider; userId: string },
): OAuthStatePayload {
  const payload = readOAuthStateToken(state);

  if (payload.provider !== expected.provider || payload.userId !== expected.userId) {
    throw new ApiError(403, "OAUTH_STATE_MISMATCH", "OAuth state does not match this session.");
  }

  return payload;
}

export function readOAuthStateToken(state: string): OAuthStatePayload {
  const parsedPayload = state.startsWith(`${OAUTH_STATE_TOKEN_VERSION}.`)
    ? readEncryptedStateToken(state)
    : tryReadLegacyStateToken(state);

  const payload = statePayloadSchema.safeParse(parsedPayload);
  if (!payload.success) {
    throw new ApiError(400, "OAUTH_STATE_INVALID", "OAuth state payload is invalid.");
  }

  const ageSeconds = Math.floor(Date.now() / 1000) - payload.data.iat;
  if (ageSeconds > OAUTH_STATE_MAX_AGE_SECONDS) {
    throw new ApiError(400, "OAUTH_STATE_EXPIRED", "OAuth state has expired.");
  }

  return payload.data;
}

