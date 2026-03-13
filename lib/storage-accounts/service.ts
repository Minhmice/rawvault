import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  type AccountProvider,
  accountProviderSchema,
  createLinkAccountRequestSchema,
  createLinkAccountResponseSchema,
  linkedAccountSchema,
  listAccountsResponseSchema,
  unlinkAccountRequestSchema,
  unlinkAccountResponseSchema,
  type CreateLinkAccountRequest,
  type CreateLinkAccountResponse,
  type LinkedAccount,
  type ListAccountsResponse,
  type SetActiveAccountRequest,
  type SetActiveAccountResponse,
  type UnlinkAccountRequest,
  type UnlinkAccountResponse,
  setActiveAccountRequestSchema,
  setActiveAccountResponseSchema,
} from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { storageProviderAdapters } from "@/lib/storage-accounts/providers";

const linkedAccountSelect = `
  id,
  user_id,
  provider,
  provider_account_id,
  account_email,
  provider_account_metadata,
  access_token_encrypted,
  refresh_token_encrypted,
  refresh_token_expires_at,
  token_refreshed_at,
  token_invalid_at,
  token_invalid_reason,
  is_active,
  health_status,
  quota_total_bytes,
  quota_used_bytes,
  expires_at,
  last_synced_at,
  created_at,
  updated_at
`;

const linkedAccountSelectLegacy = `
  id,
  user_id,
  provider,
  provider_account_id,
  account_email,
  access_token_encrypted,
  refresh_token_encrypted,
  is_active,
  health_status,
  quota_total_bytes,
  quota_used_bytes,
  expires_at,
  last_synced_at,
  created_at,
  updated_at
`;

type LinkedAccountRow = {
  id: string;
  user_id: string;
  provider: AccountProvider;
  provider_account_id: string;
  account_email: string | null;
  provider_account_metadata?: Record<string, unknown> | null;
  access_token_encrypted: string | null;
  refresh_token_encrypted: string | null;
  refresh_token_expires_at?: string | null;
  token_refreshed_at?: string | null;
  token_invalid_at?: string | null;
  token_invalid_reason?: string | null;
  is_active: boolean;
  health_status: "healthy" | "degraded" | "error";
  quota_total_bytes: number | null;
  quota_used_bytes: number | null;
  expires_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

const oauthAccountUpsertSchema = z.object({
  provider: accountProviderSchema,
  providerAccountId: z.string().min(1).max(255),
  accountEmail: z.string().email().nullable().optional(),
  accessTokenEncrypted: z.string().min(1),
  refreshTokenEncrypted: z.string().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  refreshTokenExpiresAt: z.string().datetime().nullable().optional(),
  tokenRefreshedAt: z.string().datetime().optional(),
  tokenInvalidAt: z.string().datetime().nullable().optional(),
  tokenInvalidReason: z.string().trim().min(1).max(500).nullable().optional(),
  quotaTotalBytes: z.number().int().nonnegative().optional(),
  quotaUsedBytes: z.number().int().nonnegative().optional(),
  providerAccountMetadata: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (input) =>
    input.quotaTotalBytes === undefined ||
    input.quotaUsedBytes === undefined ||
    input.quotaUsedBytes <= input.quotaTotalBytes,
  {
    message: "quotaUsedBytes must be less than or equal to quotaTotalBytes",
    path: ["quotaUsedBytes"],
  },
);

type CreateLinkScaffold = {
  providerAccountId?: string;
  accountEmail?: string | null;
  expiresAt?: string;
  quotaTotalBytes?: number;
  quotaUsedBytes?: number;
};

type AccountUpsertInput = {
  provider: AccountProvider;
  providerAccountId: string;
  accountEmail?: string | null;
  expiresAt?: string | null;
  refreshTokenExpiresAt?: string | null;
  tokenRefreshedAt?: string;
  tokenInvalidAt?: string | null;
  tokenInvalidReason?: string | null;
  quotaTotalBytes?: number;
  quotaUsedBytes?: number;
  accessTokenEncrypted?: string | null;
  refreshTokenEncrypted?: string | null;
  providerAccountMetadata?: Record<string, unknown> | null;
};

export type OAuthLinkedAccountUpsertInput = z.infer<typeof oauthAccountUpsertSchema>;

function isMissingPhase4LinkedAccountColumnError(error: unknown): boolean {
  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "";
  return (
    message.includes("column linked_accounts.provider_account_metadata does not exist") ||
    message.includes("column linked_accounts.refresh_token_expires_at does not exist") ||
    message.includes("column linked_accounts.token_refreshed_at does not exist") ||
    message.includes("column linked_accounts.token_invalid_at does not exist")
  );
}

function selectForLinkedAccounts(supportsPhase4Columns: boolean): string {
  return supportsPhase4Columns ? linkedAccountSelect : linkedAccountSelectLegacy;
}

async function detectPhase4LinkedAccountColumns(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { error } = await supabase
    .from("linked_accounts")
    .select("provider_account_metadata")
    .limit(1);

  if (!error) {
    return true;
  }

  if (isMissingPhase4LinkedAccountColumnError(error)) {
    return false;
  }

  throw new ApiError(
    500,
    "STORAGE_ACCOUNTS_FETCH_FAILED",
    "Failed to inspect linked account schema compatibility.",
    error.message,
  );
}

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request payload.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }

  return parsed.data;
}

function normalizeTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function providerLabel(provider: AccountProvider): string {
  return provider === "gdrive" ? "Google Drive" : "OneDrive";
}

function toAccountIdHint(providerAccountId: string): string {
  if (providerAccountId.length <= 10) {
    return providerAccountId;
  }
  return `${providerAccountId.slice(0, 4)}...${providerAccountId.slice(-4)}`;
}

function parseProviderAccountMetadata(
  value: LinkedAccountRow["provider_account_metadata"],
): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value;
}

function resolveAccountEmail(row: LinkedAccountRow): string | null {
  if (row.account_email && z.string().email().safeParse(row.account_email).success) {
    return row.account_email;
  }

  const metadata = parseProviderAccountMetadata(row.provider_account_metadata);
  const metadataEmail = metadata?.email;
  if (typeof metadataEmail === "string" && z.string().email().safeParse(metadataEmail).success) {
    return metadataEmail;
  }

  return null;
}

function resolveTokenLifecycle(row: LinkedAccountRow): LinkedAccount["tokenLifecycle"] {
  const expiresAt = normalizeTimestamp(row.expires_at);
  const hasAccessToken = Boolean(row.access_token_encrypted);
  const refreshTokenExpiresAt = normalizeTimestamp(row.refresh_token_expires_at ?? null);
  const refreshExpiryMs = refreshTokenExpiresAt
    ? new Date(refreshTokenExpiresAt).getTime()
    : null;
  const isRefreshTokenStillValid =
    refreshExpiryMs === null ||
    Number.isNaN(refreshExpiryMs) ||
    refreshExpiryMs > Date.now();
  const hasRefreshToken = Boolean(row.refresh_token_encrypted) && isRefreshTokenStillValid;

  if (row.token_invalid_at ?? null) {
    return {
      status: "expired",
      expiresAt,
      refreshAvailable: hasRefreshToken,
    };
  }

  if (!hasAccessToken) {
    return {
      status: "missing",
      expiresAt,
      refreshAvailable: hasRefreshToken,
    };
  }

  if (!expiresAt) {
    return {
      status: "valid",
      expiresAt: null,
      refreshAvailable: hasRefreshToken,
    };
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return {
      status: "valid",
      expiresAt,
      refreshAvailable: hasRefreshToken,
    };
  }

  const nowMs = Date.now();
  if (expiresAtMs <= nowMs) {
    return {
      status: "expired",
      expiresAt,
      refreshAvailable: hasRefreshToken,
    };
  }

  if (expiresAtMs - nowMs <= 5 * 60 * 1000) {
    return {
      status: "expiring_soon",
      expiresAt,
      refreshAvailable: hasRefreshToken,
    };
  }

  return {
    status: "valid",
    expiresAt,
    refreshAvailable: hasRefreshToken,
  };
}

function resolveQuotaStatus(
  quotaUsedBytes: number,
  quotaTotalBytes: number,
): LinkedAccount["quotaStatus"] {
  if (quotaTotalBytes <= 0) {
    return "unknown";
  }

  const ratio = quotaUsedBytes / quotaTotalBytes;
  if (ratio >= 1) {
    return "full";
  }
  if (ratio >= 0.9) {
    return "near_limit";
  }
  return "healthy";
}

function resolveAccountStatus(row: LinkedAccountRow): LinkedAccount["status"] {
  if (!row.is_active) {
    return "inactive";
  }

  if (row.token_invalid_at ?? null) {
    return "reauth_required";
  }

  if (row.health_status === "error") {
    return "error";
  }

  const tokenLifecycle = resolveTokenLifecycle(row);
  if (tokenLifecycle.status === "expired" || tokenLifecycle.status === "missing") {
    return "reauth_required";
  }

  return "active";
}

function normalizeAccount(row: LinkedAccountRow): LinkedAccount {
  const quotaTotalBytes = row.quota_total_bytes ?? 0;
  const quotaUsedBytes = row.quota_used_bytes ?? 0;
  const safeEmail = resolveAccountEmail(row);
  const tokenLifecycle = resolveTokenLifecycle(row);

  const normalized: LinkedAccount = {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    accountEmail: safeEmail,
    providerMetadata: {
      providerLabel: providerLabel(row.provider),
      accountIdHint: toAccountIdHint(row.provider_account_id),
      accountEmail: safeEmail,
      healthStatus: row.health_status,
    },
    status: resolveAccountStatus(row),
    quotaTotalBytes,
    quotaUsedBytes,
    quotaStatus: resolveQuotaStatus(quotaUsedBytes, quotaTotalBytes),
    isActive: row.is_active,
    expiresAt: normalizeTimestamp(row.expires_at),
    tokenLifecycle,
    lastSyncedAt: normalizeTimestamp(row.last_synced_at),
    createdAt: normalizeTimestamp(row.created_at) ?? row.created_at,
    updatedAt: normalizeTimestamp(row.updated_at) ?? row.updated_at,
  };

  return linkedAccountSchema.parse(normalized);
}

export async function listLinkedStorageAccounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<ListAccountsResponse> {
  const supportsPhase4Columns = await detectPhase4LinkedAccountColumns(supabase);
  const { data, error } = await supabase
    .from("linked_accounts")
    .select(selectForLinkedAccounts(supportsPhase4Columns))
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNTS_FETCH_FAILED",
      "Failed to fetch linked storage accounts.",
      error.message,
    );
  }

  const rows = (data ?? []) as unknown[];
  const accounts = rows.map((row) => normalizeAccount(row as unknown as LinkedAccountRow));

  return listAccountsResponseSchema.parse({
    success: true,
    accounts,
    total: accounts.length,
  });
}

function normalizeCreateLinkScaffold(input: CreateLinkAccountRequest): CreateLinkScaffold {
  const scaffold = input.scaffold ?? {};
  return {
    providerAccountId: scaffold.providerAccountId,
    accountEmail: scaffold.accountEmail,
    expiresAt: scaffold.expiresAt,
    quotaTotalBytes: scaffold.quotaTotalBytes,
    quotaUsedBytes: scaffold.quotaUsedBytes,
  };
}

async function upsertLinkedAccountRecord(
  supabase: SupabaseClient,
  userId: string,
  input: AccountUpsertInput,
): Promise<CreateLinkAccountResponse> {
  const now = new Date().toISOString();
  const supportsPhase4Columns = await detectPhase4LinkedAccountColumns(supabase);

  const { data: existing, error: existingError } = await supabase
    .from("linked_accounts")
    .select(selectForLinkedAccounts(supportsPhase4Columns))
    .eq("user_id", userId)
    .eq("provider", input.provider)
    .eq("provider_account_id", input.providerAccountId)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LOOKUP_FAILED",
      "Failed to lookup existing linked account.",
      existingError.message,
    );
  }

  const effectiveAccountEmail =
    input.accountEmail && z.string().email().safeParse(input.accountEmail).success
      ? input.accountEmail
      : null;

  const { count: activeCount, error: activeCountError } = await supabase
    .from("linked_accounts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);

  if (activeCountError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LINK_FAILED",
      "Failed to check active account status.",
      activeCountError.message,
    );
  }

  if (existing) {
    const existingRow = existing as unknown as LinkedAccountRow;
    const updateFields = {
      user_id: userId,
      provider: input.provider,
      provider_account_id: input.providerAccountId,
      account_email: effectiveAccountEmail,
      access_token_encrypted:
        input.accessTokenEncrypted ?? existingRow.access_token_encrypted ?? null,
      refresh_token_encrypted:
        input.refreshTokenEncrypted ?? existingRow.refresh_token_encrypted ?? null,
      expires_at: input.expiresAt ?? existingRow.expires_at ?? null,
      quota_total_bytes: input.quotaTotalBytes ?? existingRow.quota_total_bytes ?? 0,
      quota_used_bytes: input.quotaUsedBytes ?? existingRow.quota_used_bytes ?? 0,
      health_status: "healthy" as const,
      updated_at: now,
      ...(supportsPhase4Columns
        ? {
            provider_account_metadata:
              input.providerAccountMetadata ?? existingRow.provider_account_metadata ?? null,
            refresh_token_expires_at:
              input.refreshTokenExpiresAt ?? existingRow.refresh_token_expires_at ?? null,
            token_refreshed_at: input.tokenRefreshedAt ?? existingRow.token_refreshed_at ?? null,
            token_invalid_at:
              input.tokenInvalidAt === undefined
                ? existingRow.token_invalid_at
                : input.tokenInvalidAt,
            token_invalid_reason:
              input.tokenInvalidReason === undefined
                ? existingRow.token_invalid_reason
                : input.tokenInvalidReason,
          }
        : {}),
    };

    const { data, error } = await supabase
      .from("linked_accounts")
      .update(updateFields)
      .eq("id", existingRow.id)
      .eq("user_id", userId)
      .select(selectForLinkedAccounts(supportsPhase4Columns))
      .single();

    if (error) {
      throw new ApiError(
        500,
        "STORAGE_ACCOUNT_LINK_FAILED",
        "Failed to update linked storage account.",
        error.message,
      );
    }

    return createLinkAccountResponseSchema.parse({
      success: true,
      connect: {
        step: "linked_account_ready",
        provider: input.provider,
        authorizationUrl: null,
        state: null,
      },
      account: normalizeAccount(data as unknown as LinkedAccountRow),
      alreadyLinked: true,
    });
  }

  const insertFields = {
    user_id: userId,
    provider: input.provider,
    provider_account_id: input.providerAccountId,
    account_email: effectiveAccountEmail,
    access_token_encrypted: input.accessTokenEncrypted ?? null,
    refresh_token_encrypted: input.refreshTokenEncrypted ?? null,
    expires_at: input.expiresAt ?? null,
    quota_total_bytes: input.quotaTotalBytes ?? 0,
    quota_used_bytes: input.quotaUsedBytes ?? 0,
    health_status: "healthy" as const,
    updated_at: now,
    is_active: (activeCount ?? 0) === 0,
    ...(supportsPhase4Columns
      ? {
          provider_account_metadata: input.providerAccountMetadata ?? null,
          refresh_token_expires_at: input.refreshTokenExpiresAt ?? null,
          token_refreshed_at: input.tokenRefreshedAt ?? null,
          token_invalid_at: input.tokenInvalidAt ?? null,
          token_invalid_reason: input.tokenInvalidReason ?? null,
        }
      : {}),
  };

  const { data, error } = await supabase
    .from("linked_accounts")
    .insert(insertFields)
    .select(selectForLinkedAccounts(supportsPhase4Columns))
    .single();

  if (error) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LINK_FAILED",
      "Failed to link storage account.",
      error.message,
    );
  }

  return createLinkAccountResponseSchema.parse({
    success: true,
    connect: {
      step: "linked_account_ready",
      provider: input.provider,
      authorizationUrl: null,
      state: null,
    },
    account: normalizeAccount(data as unknown as LinkedAccountRow),
    alreadyLinked: false,
  });
}

export async function linkStorageAccount(
  supabase: SupabaseClient,
  userId: string,
  input: CreateLinkAccountRequest,
): Promise<CreateLinkAccountResponse> {
  const payload = parseInput(createLinkAccountRequestSchema, input);
  const scaffold = normalizeCreateLinkScaffold(payload);
  const providerAccountId = scaffold.providerAccountId ?? `pending-${payload.provider}-${userId}`;
  const adapter = storageProviderAdapters[payload.provider];

  await adapter.beforeLink?.({ userId, providerAccountId });

  return upsertLinkedAccountRecord(supabase, userId, {
    provider: payload.provider,
    providerAccountId,
    accountEmail: scaffold.accountEmail ?? null,
    expiresAt: scaffold.expiresAt ?? null,
    quotaTotalBytes: scaffold.quotaTotalBytes,
    quotaUsedBytes: scaffold.quotaUsedBytes,
    accessTokenEncrypted: null,
    refreshTokenEncrypted: null,
  });
}

export async function upsertLinkedStorageAccountFromOAuth(
  supabase: SupabaseClient,
  userId: string,
  input: OAuthLinkedAccountUpsertInput,
): Promise<CreateLinkAccountResponse> {
  const payload = parseInput(oauthAccountUpsertSchema, input);
  return upsertLinkedAccountRecord(supabase, userId, {
    provider: payload.provider,
    providerAccountId: payload.providerAccountId,
    accountEmail: payload.accountEmail ?? null,
    accessTokenEncrypted: payload.accessTokenEncrypted,
    refreshTokenEncrypted: payload.refreshTokenEncrypted ?? null,
    expiresAt: payload.expiresAt ?? null,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt ?? null,
    tokenRefreshedAt: payload.tokenRefreshedAt,
    tokenInvalidAt: payload.tokenInvalidAt,
    tokenInvalidReason: payload.tokenInvalidReason,
    quotaTotalBytes: payload.quotaTotalBytes,
    quotaUsedBytes: payload.quotaUsedBytes,
    providerAccountMetadata: payload.providerAccountMetadata,
  });
}

export async function unlinkStorageAccount(
  supabase: SupabaseClient,
  userId: string,
  input: UnlinkAccountRequest,
): Promise<UnlinkAccountResponse> {
  const payload = parseInput(unlinkAccountRequestSchema, input);

  const supportsPhase4Columns = await detectPhase4LinkedAccountColumns(supabase);
  const { data: account, error: accountError } = await supabase
    .from("linked_accounts")
    .select(selectForLinkedAccounts(supportsPhase4Columns))
    .eq("id", payload.accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (accountError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LOOKUP_FAILED",
      "Failed to fetch linked account.",
      accountError.message,
    );
  }

  if (!account) {
    throw new ApiError(404, "STORAGE_ACCOUNT_NOT_FOUND", "Account not found.");
  }

  const { count: relatedFilesCount, error: relatedFilesError } = await supabase
    .from("files")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("storage_account_id", payload.accountId);

  if (relatedFilesError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_UNLINK_FAILED",
      "Failed to verify linked file references.",
      relatedFilesError.message,
    );
  }

  if ((relatedFilesCount ?? 0) > 0) {
    throw new ApiError(
      409,
      "ACCOUNT_HAS_LINKED_FILES",
      "Account has file references and cannot be unlinked in foundation slice.",
      { linkedFiles: relatedFilesCount },
    );
  }

  if ((account as unknown as LinkedAccountRow).is_active) {
    const { count: remainingAccountsCount, error: remainingAccountsError } =
      await supabase
        .from("linked_accounts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .neq("id", payload.accountId);

    if (remainingAccountsError) {
      throw new ApiError(
        500,
        "STORAGE_ACCOUNT_UNLINK_FAILED",
        "Failed to verify remaining accounts.",
        remainingAccountsError.message,
      );
    }

    if ((remainingAccountsCount ?? 0) > 0) {
      throw new ApiError(
        409,
        "ACTIVE_ACCOUNT_PROTECTION",
        "Cannot unlink current active account while other accounts exist. Set another account as active first.",
      );
    }
  }

  const { error: unlinkError } = await supabase
    .from("linked_accounts")
    .delete()
    .eq("id", payload.accountId)
    .eq("user_id", userId);

  if (unlinkError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_UNLINK_FAILED",
      "Failed to unlink storage account.",
      unlinkError.message,
    );
  }

  return unlinkAccountResponseSchema.parse({
    success: true,
    accountId: payload.accountId,
    unlinked: true,
  });
}

export async function setActiveStorageAccount(
  supabase: SupabaseClient,
  userId: string,
  input: SetActiveAccountRequest,
): Promise<SetActiveAccountResponse> {
  const payload = parseInput(setActiveAccountRequestSchema, input);

  const supportsPhase4Columns = await detectPhase4LinkedAccountColumns(supabase);
  const { data: targetAccount, error: targetError } = await supabase
    .from("linked_accounts")
    .select(selectForLinkedAccounts(supportsPhase4Columns))
    .eq("id", payload.accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (targetError) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_LOOKUP_FAILED",
      "Failed to lookup target account.",
      targetError.message,
    );
  }

  if (!targetAccount) {
    throw new ApiError(404, "STORAGE_ACCOUNT_NOT_FOUND", "Account not found.");
  }

  const { data, error } = await supabase.rpc("set_active_linked_account", {
    p_user_id: userId,
    p_account_id: payload.accountId,
  });

  if (error) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_SET_ACTIVE_FAILED",
      "Failed to set active storage account.",
      error.message,
    );
  }

  const accountRow = Array.isArray(data) ? data[0] : data;
  if (!accountRow) {
    throw new ApiError(
      500,
      "STORAGE_ACCOUNT_SET_ACTIVE_FAILED",
      "Active account update returned no row.",
    );
  }

  return setActiveAccountResponseSchema.parse({
    success: true,
    account: normalizeAccount(accountRow as unknown as LinkedAccountRow),
  });
}
