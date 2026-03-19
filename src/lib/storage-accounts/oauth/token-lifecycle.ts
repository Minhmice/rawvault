/**
 * Token lifecycle helper: decrypt and refresh-on-demand for provider API use.
 * Server-only. Never expose decrypted tokens.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { getOAuthProviderConfig } from "@/lib/storage-accounts/oauth/config";
import { storageOAuthProviderAdapters } from "@/lib/storage-accounts/oauth/providers";
import {
  decryptProviderToken,
  encryptProviderToken,
} from "@/lib/storage-accounts/oauth/token-crypto";

const REFRESH_BUFFER_MS = 5 * 60 * 1000;

const PHASE4_SELECT =
  "id, user_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at, token_invalid_at";
const LEGACY_SELECT =
  "id, user_id, provider, access_token_encrypted, refresh_token_encrypted, expires_at";

function isMissingPhase4ColumnError(err: { message?: string }): boolean {
  const msg = err?.message ?? "";
  return msg.includes("token_invalid_at does not exist");
}

type LinkedAccountTokenRow = {
  id: string;
  user_id: string;
  provider: AccountProvider;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  token_invalid_at?: string | null;
};

export type UsableTokenResult = {
  accessToken: string;
  accountId: string;
  provider: AccountProvider;
};

export async function getUsableProviderToken(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<UsableTokenResult> {
  let row: LinkedAccountTokenRow | null = null;
  let loadError: string | null = null;

  const result1 = await supabase
    .from("linked_accounts")
    .select(PHASE4_SELECT)
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result1.error) {
    if (isMissingPhase4ColumnError(result1.error)) {
      const result2 = await supabase
        .from("linked_accounts")
        .select(LEGACY_SELECT)
        .eq("id", accountId)
        .eq("user_id", userId)
        .maybeSingle();
      if (result2.error) {
        loadError = result2.error.message;
      } else {
        row = result2.data as LinkedAccountTokenRow | null;
        if (row) row.token_invalid_at = null;
      }
    } else {
      loadError = result1.error.message;
    }
  } else {
    row = result1.data as LinkedAccountTokenRow | null;
  }

  if (loadError) {
    throw new ApiError(
      500,
      "TOKEN_LOAD_FAILED",
      `Failed to load linked account for token access. ${loadError}`,
      { originalError: loadError },
    );
  }

  if (!row) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Linked account not found.");
  }

  const account = row;

  if (account.token_invalid_at) {
    throw new ApiError(
      409,
      "TOKEN_INVALID",
      "Provider token is marked invalid. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  if (!account.access_token_encrypted) {
    throw new ApiError(
      409,
      "TOKEN_MISSING",
      "Linked account has no stored access token. Complete provider connection first.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  let accessToken: string;
  try {
    accessToken = decryptProviderToken(account.access_token_encrypted);
  } catch {
    throw new ApiError(
      409,
      "TOKEN_DECRYPT_FAILED",
      "Failed to decrypt stored token. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  const expiresAtMs = account.expires_at ? new Date(account.expires_at).getTime() : null;
  const nowMs = Date.now();
  const needsRefresh =
    expiresAtMs !== null &&
    !Number.isNaN(expiresAtMs) &&
    (expiresAtMs <= nowMs || expiresAtMs - nowMs <= REFRESH_BUFFER_MS);

  if (needsRefresh && account.refresh_token_encrypted) {
    const refreshed = await refreshAndPersistToken(supabase, userId, account);
    return { accessToken: refreshed.accessToken, accountId: account.id, provider: account.provider };
  }

  if (needsRefresh && !account.refresh_token_encrypted) {
    throw new ApiError(
      409,
      "TOKEN_EXPIRED",
      "Access token expired and no refresh token available. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  return { accessToken, accountId: account.id, provider: account.provider };
}

async function refreshAndPersistToken(
  supabase: SupabaseClient,
  userId: string,
  account: LinkedAccountTokenRow,
): Promise<{ accessToken: string }> {
  const refreshTokenEncrypted = account.refresh_token_encrypted;
  if (!refreshTokenEncrypted) {
    throw new ApiError(
      409,
      "TOKEN_EXPIRED",
      "No refresh token available. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  let refreshToken: string;
  try {
    refreshToken = decryptProviderToken(refreshTokenEncrypted);
  } catch {
    throw new ApiError(
      409,
      "TOKEN_DECRYPT_FAILED",
      "Failed to decrypt refresh token. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  const config = getOAuthProviderConfig(account.provider);
  const adapter = storageOAuthProviderAdapters[account.provider];

  let tokenResult;
  try {
    tokenResult = await adapter.refreshAccessToken(config, refreshToken);
  } catch {
    await markAccountTokenInvalid(supabase, userId, account.id, "Refresh failed");
    throw new ApiError(
      409,
      "TOKEN_REFRESH_FAILED",
      "Provider token refresh failed. Re-authenticate the account.",
      { code: "REAUTH_REQUIRED" },
    );
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("linked_accounts")
    .update({
      access_token_encrypted: encryptProviderToken(tokenResult.accessToken),
      refresh_token_encrypted: tokenResult.refreshToken
        ? encryptProviderToken(tokenResult.refreshToken)
        : refreshTokenEncrypted,
      expires_at: tokenResult.expiresAt,
      refresh_token_expires_at: tokenResult.refreshTokenExpiresAt,
      token_refreshed_at: now,
      token_invalid_at: null,
      token_invalid_reason: null,
      updated_at: now,
    })
    .eq("id", account.id)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(
      500,
      "TOKEN_PERSIST_FAILED",
      "Failed to persist refreshed token.",
      error.message,
    );
  }

  return { accessToken: tokenResult.accessToken };
}

export async function markAccountTokenInvalid(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  reason: string,
): Promise<void> {
  const now = new Date().toISOString();
  await supabase
    .from("linked_accounts")
    .update({
      token_invalid_at: now,
      token_invalid_reason: reason.slice(0, 500),
      updated_at: now,
    })
    .eq("id", accountId)
    .eq("user_id", userId);
}
