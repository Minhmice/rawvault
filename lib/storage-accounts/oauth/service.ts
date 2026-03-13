import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { ApiError, isApiError } from "@/lib/api/errors";
import {
  providerCallbackRequestSchema,
  providerCallbackResponseSchema,
  providerConnectCallbackQueryParamKeys,
  providerConnectCallbackQuerySchema,
  providerConnectCallbackSchema,
  providerConnectRequestSchema,
  providerConnectResponseSchema,
  type AccountProvider,
  type ProviderCallbackResponse,
  type ProviderConnectCallback,
  type ProviderConnectResponse,
} from "@/lib/contracts";
import { getOAuthProviderConfig } from "@/lib/storage-accounts/oauth/config";
import { storageOAuthProviderAdapters } from "@/lib/storage-accounts/oauth/providers";
import {
  createOAuthStateToken,
  readOAuthStateToken,
} from "@/lib/storage-accounts/oauth/state";
import {
  assertProviderTokenEncryptionReady,
  encryptProviderToken,
} from "@/lib/storage-accounts/oauth/token-crypto";
import { upsertLinkedStorageAccountFromOAuth } from "@/lib/storage-accounts/service";

type ProviderOAuthCallbackResult = {
  returnTo: string;
  response: ProviderCallbackResponse;
};

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request payload.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  return parsed.data;
}

function normalizeReturnTo(returnTo: string): string {
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return "/";
  }
  return returnTo;
}

function sanitizeCallbackMessage(message: string | undefined): string | undefined {
  if (!message) {
    return undefined;
  }
  const trimmed = message.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.length > 500 ? `${trimmed.slice(0, 497)}...` : trimmed;
}

function toCallback(
  provider: AccountProvider,
  status: ProviderConnectCallback["status"],
  message?: string,
): ProviderConnectCallback {
  return providerConnectCallbackSchema.parse({
    provider,
    status,
    message: sanitizeCallbackMessage(message),
  });
}

function normalizeProviderAccountMetadata(
  provider: AccountProvider,
  metadata: Record<string, unknown>,
  accountEmail: string | null,
): Record<string, unknown> {
  const base = { provider, email: accountEmail };

  if (provider === "gdrive") {
    return {
      ...base,
      permissionId:
        typeof metadata.permissionId === "string" ? metadata.permissionId : null,
      displayName:
        typeof metadata.displayName === "string" ? metadata.displayName : null,
    };
  }

  return {
    ...base,
    accountObjectId:
      typeof metadata.accountObjectId === "string" ? metadata.accountObjectId : null,
    userPrincipalName:
      typeof metadata.userPrincipalName === "string"
        ? metadata.userPrincipalName
        : null,
  };
}

function buildCallbackResponse(
  callback: ProviderConnectCallback,
  account: ProviderCallbackResponse["account"],
  relinked: boolean,
): ProviderCallbackResponse {
  return providerCallbackResponseSchema.parse({
    success: true,
    callback,
    account,
    relinked,
  });
}

export function buildProviderConnectCallbackRedirectUrl(
  returnTo: string,
  callback: ProviderConnectCallback,
): string {
  const safeReturnTo = normalizeReturnTo(returnTo);
  const [path, rawSearch = ""] = safeReturnTo.split("?", 2);
  const params = new URLSearchParams(rawSearch);

  params.set(providerConnectCallbackQueryParamKeys.provider, callback.provider);
  params.set(providerConnectCallbackQueryParamKeys.status, callback.status);
  if (callback.message) {
    params.set(providerConnectCallbackQueryParamKeys.message, callback.message);
  } else {
    params.delete(providerConnectCallbackQueryParamKeys.message);
  }

  const query = params.toString();
  return query.length > 0 ? `${path}?${query}` : path;
}

export function buildProviderConnectCallbackErrorRedirectUrl(
  state: string | undefined,
  error: unknown,
): string | null {
  if (!state) {
    return null;
  }

  try {
    const statePayload = readOAuthStateToken(state);
    const message = isApiError(error)
      ? error.message
      : "Failed to complete provider connection.";
    const callback = toCallback(statePayload.provider, "error", message);
    return buildProviderConnectCallbackRedirectUrl(statePayload.returnTo, callback);
  } catch {
    return null;
  }
}

export function startProviderOAuthConnect(
  userId: string,
  input: unknown,
): ProviderConnectResponse {
  const payload = parseInput(providerConnectRequestSchema, input);
  const config = getOAuthProviderConfig(payload.provider, payload.redirectUri);
  const adapter = storageOAuthProviderAdapters[payload.provider];
  const state = createOAuthStateToken({
    provider: payload.provider,
    userId,
    returnTo: payload.returnTo,
  });

  return providerConnectResponseSchema.parse({
    success: true,
    provider: payload.provider,
    authorizationUrl: adapter.buildAuthorizationUrl(config, state),
  });
}

export async function completeProviderOAuthCallback(
  supabase: SupabaseClient,
  userId: string,
  input: unknown,
): Promise<ProviderOAuthCallbackResult> {
  const payload = parseInput(providerConnectCallbackQuerySchema, input);
  const statePayload = readOAuthStateToken(payload.state);
  const provider = statePayload.provider;
  const returnTo = statePayload.returnTo;

  if (statePayload.userId !== userId) {
    throw new ApiError(403, "OAUTH_STATE_MISMATCH", "OAuth state does not match this session.");
  }

  if (payload.error) {
    const status =
      payload.error === "access_denied" || payload.error === "user_cancelled"
        ? "cancelled"
        : "error";
    return {
      returnTo,
      response: buildCallbackResponse(
        toCallback(provider, status, payload.errorDescription ?? payload.error),
        null,
        false,
      ),
    };
  }

  const callbackInput = parseInput(providerCallbackRequestSchema, {
    provider,
    code: payload.code,
    state: payload.state,
    error: payload.error,
    errorDescription: payload.errorDescription,
    redirectUri: payload.redirectUri,
    returnTo,
  });

  if (!callbackInput.code) {
    throw new ApiError(
      400,
      "OAUTH_CALLBACK_INVALID",
      "OAuth callback did not include an authorization code.",
    );
  }

  const config = getOAuthProviderConfig(provider, callbackInput.redirectUri);
  assertProviderTokenEncryptionReady();
  const adapter = storageOAuthProviderAdapters[provider];
  const tokenResult = await adapter.exchangeCodeForToken(config, callbackInput.code);
  const identity = await adapter.fetchIdentity(tokenResult.accessToken);

  const linkedResult = await upsertLinkedStorageAccountFromOAuth(supabase, userId, {
    provider,
    providerAccountId: identity.providerAccountId,
    accountEmail: identity.accountEmail ?? null,
    accessTokenEncrypted: encryptProviderToken(tokenResult.accessToken),
    refreshTokenEncrypted: tokenResult.refreshToken
      ? encryptProviderToken(tokenResult.refreshToken)
      : null,
    expiresAt: tokenResult.expiresAt,
    refreshTokenExpiresAt: tokenResult.refreshTokenExpiresAt,
    tokenRefreshedAt: new Date().toISOString(),
    tokenInvalidAt: null,
    tokenInvalidReason: null,
    quotaTotalBytes: identity.quotaTotalBytes,
    quotaUsedBytes: identity.quotaUsedBytes,
    providerAccountMetadata: normalizeProviderAccountMetadata(
      provider,
      identity.providerMetadata,
      identity.accountEmail,
    ),
  });

  if (!linkedResult.account) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LINK_FAILED",
      "Linked account was not returned after OAuth callback.",
    );
  }

  return {
    returnTo,
    response: buildCallbackResponse(
      toCallback(provider, "success"),
      linkedResult.account,
      linkedResult.alreadyLinked,
    ),
  };
}
