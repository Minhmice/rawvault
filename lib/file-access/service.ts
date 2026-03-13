/**
 * Phase 9: File access service.
 * Resolves file metadata, enforces ownership, gets provider token, delegates to adapter.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { fileIdParamsSchema } from "@/lib/contracts";
import { getUsableProviderToken } from "@/lib/storage-accounts/oauth/token-lifecycle";
import { markAccountTokenInvalid } from "@/lib/storage-accounts/oauth/token-lifecycle";
import { downloadFromGoogleDrive } from "./adapters/gdrive.download";
import { downloadFromOneDrive } from "./adapters/onedrive.download";

type FileAccessRow = {
  id: string;
  user_id: string;
  name: string;
  mime: string | null;
  size_bytes: number;
  storage_provider: AccountProvider;
  storage_account_id: string | null;
  provider_file_id_original: string;
  deleted_at: string | null;
};

function parseInput<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid file id.", undefined);
  }
  return parsed.data as T;
}

export async function resolveFileForAccess(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
): Promise<{
  fileId: string;
  name: string;
  mime: string | null;
  sizeBytes: number;
  provider: AccountProvider;
  storageAccountId: string;
  providerFileId: string;
}> {
  const params = parseInput(fileIdParamsSchema, { id: fileId });

  const { data, error } = await supabase
    .from("files")
    .select(
      "id, user_id, name, mime, size_bytes, storage_provider, storage_account_id, provider_file_id_original, deleted_at",
    )
    .eq("id", params.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "FILE_ACCESS_FAILED",
      "Failed to resolve file for access.",
      error.message,
    );
  }

  if (!data) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const row = data as FileAccessRow;

  if (row.deleted_at) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  if (!row.storage_account_id) {
    throw new ApiError(
      400,
      "ACCOUNT_NOT_FOUND",
      "File has no linked storage account.",
      { fileId: row.id },
    );
  }

  return {
    fileId: row.id,
    name: row.name,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes),
    provider: row.storage_provider,
    storageAccountId: row.storage_account_id,
    providerFileId: row.provider_file_id_original,
  };
}

export type FileAccessResult = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number | null;
  fileName: string;
};

export async function accessFileContent(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
): Promise<FileAccessResult> {
  const resolved = await resolveFileForAccess(supabase, userId, fileId);

  const tokenResult = await getUsableProviderToken(
    supabase,
    userId,
    resolved.storageAccountId,
  );

  try {
    const result =
      resolved.provider === "gdrive"
        ? await downloadFromGoogleDrive({
            accessToken: tokenResult.accessToken,
            providerFileId: resolved.providerFileId,
          })
        : await downloadFromOneDrive({
            accessToken: tokenResult.accessToken,
            providerFileId: resolved.providerFileId,
          });

    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "file_access",
      resource_type: "file",
      resource_id: resolved.fileId,
      payload: {
        provider: resolved.provider,
        storage_account_id: resolved.storageAccountId,
        file_name: resolved.name,
      },
    });

    return {
      body: result.body,
      contentType: result.contentType,
      contentLength: result.contentLength,
      fileName: resolved.name,
    };
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
          resolved.storageAccountId,
          `File access failed: ${err.message}`,
        );
      }
    }
    throw err;
  }
}
