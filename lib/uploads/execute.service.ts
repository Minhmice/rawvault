/**
 * Phase 6: Upload execution orchestration.
 * Validates → dispatch → token → provider upload → metadata persistence → log.
 * When no single account has enough space and no preferred account, may split across default+overflow.
 * Never writes metadata before provider success.
 *
 * Error classification (retryable vs user-action): see docs/upload-execute-errors.md.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { AccountProvider } from "@/lib/contracts";
import {
  uploadExecuteRequestSchema,
  uploadExecuteSuccessResponseSchema,
  type UploadExecuteRequest,
  type UploadExecuteSuccessResponse,
} from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { dispatchUploadTarget } from "@/lib/uploads/dispatch.service";
import { getUsableProviderToken } from "@/lib/storage-accounts/oauth/token-lifecycle";
import { uploadToGoogleDrive } from "@/lib/uploads/adapters/gdrive.upload";
import { uploadToOneDrive } from "@/lib/uploads/adapters/onedrive.upload";
import { markAccountTokenInvalid } from "@/lib/storage-accounts/oauth/token-lifecycle";

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB for MVP

type OverflowAccount = {
  id: string;
  provider: AccountProvider;
  quotaTotalBytes: number | null;
  quotaUsedBytes: number | null;
};

function remainingQuota(acc: OverflowAccount): number | null {
  if (
    acc.quotaTotalBytes === null ||
    acc.quotaUsedBytes === null ||
    acc.quotaTotalBytes < acc.quotaUsedBytes
  ) {
    return null;
  }
  return acc.quotaTotalBytes - acc.quotaUsedBytes;
}

/** Load default + overflow accounts ordered by is_default_write desc, overflow_priority asc. */
async function getDefaultAndOverflowAccounts(
  supabase: SupabaseClient,
  userId: string,
): Promise<OverflowAccount[]> {
  const { data, error } = await supabase
    .from("linked_accounts")
    .select("id, provider, quota_total_bytes, quota_used_bytes, is_default_write, overflow_priority")
    .eq("user_id", userId)
    .order("is_default_write", { ascending: false })
    .order("overflow_priority", { ascending: true });

  if (error) {
    throw new ApiError(
      500,
      "UPLOAD_DISPATCH_LOOKUP_FAILED",
      "Failed to load accounts for split.",
      error.message,
    );
  }

  const rows = (data ?? []) as Array<{
    id: string;
    provider: AccountProvider;
    quota_total_bytes: number | null;
    quota_used_bytes: number | null;
  }>;
  return rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    quotaTotalBytes: r.quota_total_bytes,
    quotaUsedBytes: r.quota_used_bytes,
  }));
}

/** Compute part sizes and which account gets each part; returns null if total free < sizeBytes. */
function computePartSizes(
  accounts: OverflowAccount[],
  sizeBytes: number,
): Array<{ account: OverflowAccount; sizeBytes: number }> | null {
  let remaining = sizeBytes;
  const result: Array<{ account: OverflowAccount; sizeBytes: number }> = [];
  for (const acc of accounts) {
    const free = remainingQuota(acc);
    if (free === null || free <= 0) continue;
    const part = Math.min(free, remaining);
    if (part <= 0) continue;
    result.push({ account: acc, sizeBytes: part });
    remaining -= part;
    if (remaining <= 0) break;
  }
  return remaining <= 0 ? result : null;
}

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid upload request.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  return parsed.data;
}

function extractExt(fileName: string): string | null {
  const last = fileName.split(".").pop();
  if (!last || last === fileName) return null;
  return last.toLowerCase().slice(0, 20);
}

function normalizeTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

async function ensureFolderOwned(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("folders")
    .select("id")
    .eq("id", folderId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) {
    throw new ApiError(404, "PARENT_NOT_FOUND", "Target folder not found.");
  }
}

export async function executeUpload(
  supabase: SupabaseClient,
  userId: string,
  request: UploadExecuteRequest,
  fileBody: ArrayBuffer,
): Promise<UploadExecuteSuccessResponse> {
  const parsed = parseInput(uploadExecuteRequestSchema, request);

  if (parsed.folderId) {
    await ensureFolderOwned(supabase, userId, parsed.folderId);
  }

  if (fileBody.byteLength > MAX_UPLOAD_BYTES) {
    throw new ApiError(
      400,
      "FILE_TOO_LARGE",
      `File exceeds maximum upload size (${MAX_UPLOAD_BYTES} bytes).`,
    );
  }

  if (fileBody.byteLength !== parsed.sizeBytes) {
    throw new ApiError(
      400,
      "SIZE_MISMATCH",
      "Declared size does not match actual file size.",
    );
  }

  const effectivePreferredAccountId =
    parsed.accountId ?? parsed.preferredAccountId;
  const usePreferred =
    effectivePreferredAccountId != null || parsed.preferredProvider != null;

  let dispatchResult: Awaited<ReturnType<typeof dispatchUploadTarget>>;
  try {
    dispatchResult = await dispatchUploadTarget(supabase, userId, {
      fileName: parsed.fileName,
      sizeBytes: parsed.sizeBytes,
      mime: parsed.mime,
      folderId: parsed.folderId,
      preferredProvider: parsed.preferredProvider,
      preferredAccountId: effectivePreferredAccountId,
    });
  } catch (dispatchError) {
    if (
      !usePreferred &&
      dispatchError instanceof ApiError &&
      dispatchError.code === "NO_ELIGIBLE_ACCOUNT"
    ) {
      const overflowAccounts = await getDefaultAndOverflowAccounts(
        supabase,
        userId,
      );
      const partPlan = computePartSizes(overflowAccounts, parsed.sizeBytes);
      if (partPlan !== null && partPlan.length > 0) {
        return executeSplitUpload(
          supabase,
          userId,
          parsed,
          fileBody,
          partPlan,
        );
      }
    }
    throw dispatchError;
  }

  const { provider, storageAccountId } = dispatchResult.dispatch;

  const tokenResult = await getUsableProviderToken(supabase, userId, storageAccountId);
  const accessToken = tokenResult.accessToken;

  const parentFolderId =
    parsed.accountId != null
      ? (parsed.providerFolderId ?? null)
      : (null as string | null);

  const adapterInput = {
    accessToken,
    fileName: parsed.fileName,
    mime: parsed.mime ?? null,
    body: fileBody,
    sizeBytes: parsed.sizeBytes,
    parentFolderId,
  };

  let providerResult;
  try {
    providerResult =
      provider === "gdrive"
        ? await uploadToGoogleDrive(adapterInput)
        : await uploadToOneDrive(adapterInput);
  } catch (uploadError) {
    if (uploadError instanceof ApiError) {
      const isAuthError =
        uploadError.code === "OAUTH_TOKEN_INVALID" ||
        uploadError.status === 401 ||
        uploadError.status === 403;
      if (isAuthError) {
        await markAccountTokenInvalid(
          supabase,
          userId,
          storageAccountId,
          `Upload failed: ${uploadError.message}`,
        );
      }
    }
    throw uploadError;
  }

  const ext = extractExt(parsed.fileName);
  const basePayload = {
    user_id: userId,
    folder_id: parsed.folderId ?? null,
    name: parsed.fileName,
    ext,
    mime: parsed.mime ?? null,
    size_bytes: parsed.sizeBytes,
    storage_provider: provider,
    storage_account_id: storageAccountId,
    provider_file_id_original: providerResult.providerFileId,
    provider_file_id_thumb: null,
    provider_file_id_preview: null,
    preview_status: "pending",
    sync_status: "synced",
    error_code: null,
    metadata: providerResult.providerMetadata ?? null,
    deleted_at: null,
  };

  let insertPayload: Record<string, unknown> = {
    ...basePayload,
    is_split: false,
    viewer_mode: "inline",
  };

  let result = await supabase
    .from("files")
    .insert(insertPayload)
    .select("id, name, created_at, updated_at")
    .single();

  const isLegacyFilesSchema =
    result.error && /does not exist/i.test(result.error.message ?? "") && /is_split|viewer_mode/i.test(result.error.message ?? "");
  if (isLegacyFilesSchema) {
    insertPayload = basePayload;
    result = await supabase
      .from("files")
      .insert(insertPayload)
      .select("id, name, created_at, updated_at")
      .single();
  }

  const insertError = result.error;
  const fileRow = result.data;

  if (insertError || !fileRow) {
    try {
      await supabase.from("activity_logs").insert({
        user_id: userId,
        action: "upload_metadata_persistence_failed",
        resource_type: "file",
        resource_id: null,
        payload: {
          provider,
          storage_account_id: storageAccountId,
          provider_file_id: providerResult.providerFileId,
          file_name: parsed.fileName,
          error: insertError?.message,
        },
      });
    } catch {
      /* best effort; always throw the canonical ApiError */
    }
    const schemaHint =
      insertError && /column.*does not exist|is_split|viewer_mode/.test(insertError.message ?? "")
        ? " Run migrations: npx supabase db push (or supabase migration up)."
        : "";
    throw new ApiError(
      500,
      "METADATA_PERSISTENCE_FAILED",
      `File uploaded to provider but metadata persistence failed.${schemaHint}`,
      { providerFileId: providerResult.providerFileId, original: insertError?.message },
    );
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "upload_executed",
    resource_type: "file",
    resource_id: fileRow.id,
    payload: {
      provider,
      storage_account_id: storageAccountId,
      provider_file_id: providerResult.providerFileId,
      file_name: parsed.fileName,
      size_bytes: parsed.sizeBytes,
    },
  });

  return uploadExecuteSuccessResponseSchema.parse({
    success: true,
    file: {
      id: fileRow.id,
      name: fileRow.name,
      provider,
      storageAccountId,
      providerFileId: providerResult.providerFileId,
      sizeBytes: parsed.sizeBytes,
      createdAt: normalizeTimestamp(fileRow.created_at),
      updatedAt: normalizeTimestamp(fileRow.updated_at),
    },
  });
}

async function executeSplitUpload(
  supabase: SupabaseClient,
  userId: string,
  parsed: UploadExecuteRequest,
  fileBody: ArrayBuffer,
  partPlan: Array<{ account: OverflowAccount; sizeBytes: number }>,
): Promise<UploadExecuteSuccessResponse> {
  const parts: Array<{ providerFileId: string; provider: AccountProvider; accountId: string }> = [];
  let offset = 0;
  const mime = parsed.mime ?? null;

  for (let i = 0; i < partPlan.length; i++) {
    const { account, sizeBytes: size } = partPlan[i];

    const tokenResult = await getUsableProviderToken(supabase, userId, account.id);
    const chunk = fileBody.slice(offset, offset + size);
    const adapterInput = {
      accessToken: tokenResult.accessToken,
      fileName: `${parsed.fileName}.part${i}`,
      mime,
      body: chunk,
      sizeBytes: size,
      parentFolderId: null as string | null,
    };

    try {
      const result =
        account.provider === "gdrive"
          ? await uploadToGoogleDrive(adapterInput)
          : await uploadToOneDrive(adapterInput);
      parts.push({
        providerFileId: result.providerFileId,
        provider: account.provider,
        accountId: account.id,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const isAuthError =
          err.code === "OAUTH_TOKEN_INVALID" ||
          err.status === 401 ||
          err.status === 403;
        if (isAuthError) {
          await markAccountTokenInvalid(
            supabase,
            userId,
            account.id,
            `Split upload part failed: ${err.message}`,
          );
        }
      }
      throw err;
    }
    offset += size;
  }

  const ext = extractExt(parsed.fileName);
  const firstPart = parts[0];
  if (!firstPart) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Split upload produced no parts.");
  }

  const insertPayload = {
    user_id: userId,
    folder_id: parsed.folderId ?? null,
    name: parsed.fileName,
    ext,
    mime,
    size_bytes: parsed.sizeBytes,
    storage_provider: firstPart.provider,
    storage_account_id: firstPart.accountId,
    provider_file_id_original: firstPart.providerFileId,
    provider_file_id_thumb: null,
    provider_file_id_preview: null,
    preview_status: "pending",
    sync_status: "synced",
    error_code: null,
    metadata: null,
    deleted_at: null,
    is_split: true,
    viewer_mode: "download_only",
  };

  const { data: fileRow, error: insertError } = await supabase
    .from("files")
    .insert(insertPayload)
    .select("id, name, created_at, updated_at")
    .single();

  if (insertError) {
    throw new ApiError(
      500,
      "METADATA_PERSISTENCE_FAILED",
      "Split upload succeeded but file metadata persistence failed.",
      { message: insertError.message },
    );
  }

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const size = partPlan[i].sizeBytes;
    await supabase.from("file_parts").insert({
      file_id: fileRow.id,
      part_index: i,
      drive_id: part.accountId,
      provider_file_id: part.providerFileId,
      size_bytes: size,
    });
  }

  await supabase.from("activity_logs").insert({
    user_id: userId,
    action: "upload_executed",
    resource_type: "file",
    resource_id: fileRow.id,
    payload: {
      split: true,
      parts: parts.length,
      file_name: parsed.fileName,
      size_bytes: parsed.sizeBytes,
    },
  });

  return uploadExecuteSuccessResponseSchema.parse({
    success: true,
    file: {
      id: fileRow.id,
      name: fileRow.name,
      provider: firstPart.provider,
      storageAccountId: firstPart.accountId,
      providerFileId: firstPart.providerFileId,
      sizeBytes: parsed.sizeBytes,
      createdAt: normalizeTimestamp(fileRow.created_at),
      updatedAt: normalizeTimestamp(fileRow.updated_at),
    },
  });
}
