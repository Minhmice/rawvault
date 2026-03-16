/**
 * Import folder or file from Drive/OneDrive into RawVault metadata.
 * Does NOT copy files — creates metadata records linking to provider resources.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AccountProvider } from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { createFolder } from "@/lib/metadata/service";
import type { DriveImportFolderRequest, DriveImportFileRequest } from "@/lib/contracts/drive-import.contracts";

async function getAccountProvider(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
): Promise<AccountProvider> {
  const { data, error } = await supabase
    .from("linked_accounts")
    .select("provider")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "ACCOUNT_LOOKUP_FAILED",
      "Failed to look up linked account.",
      error.message,
    );
  }
  if (!data) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Linked account not found.");
  }

  return data.provider as AccountProvider;
}

function extractExt(fileName: string): string | null {
  const last = fileName.split(".").pop();
  if (!last || last === fileName) return null;
  return last.toLowerCase().slice(0, 20);
}

export async function importFolderFromDrive(
  supabase: SupabaseClient,
  userId: string,
  request: DriveImportFolderRequest,
) {
  await getAccountProvider(supabase, userId, request.accountId);

  const result = await createFolder(supabase, userId, {
    name: request.name,
    parentId: request.parentFolderId ?? null,
  });

  return result;
}

export async function importFileFromDrive(
  supabase: SupabaseClient,
  userId: string,
  request: DriveImportFileRequest,
) {
  const provider = await getAccountProvider(supabase, userId, request.accountId);

  const folderId = request.folderId ?? null;
  if (folderId) {
    const { data: folder } = await supabase
      .from("folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!folder) {
      throw new ApiError(404, "PARENT_NOT_FOUND", "Target folder not found.");
    }
  }

  const ext = extractExt(request.name);

  const { data, error } = await supabase
    .from("files")
    .insert({
      user_id: userId,
      folder_id: folderId,
      name: request.name,
      ext,
      mime: request.mimeType ?? null,
      size_bytes: request.sizeBytes,
      storage_provider: provider,
      storage_account_id: request.accountId,
      provider_file_id_original: request.providerFileId,
      provider_file_id_thumb: null,
      provider_file_id_preview: null,
      preview_status: "pending",
      sync_status: "synced",
      error_code: null,
      metadata: null,
      deleted_at: null,
    })
    .select("id, name, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(
        409,
        "FILE_ALREADY_EXISTS",
        "A file with this name already exists in this folder.",
      );
    }
    throw new ApiError(500, "IMPORT_FAILED", "Failed to import file.", error.message);
  }

  return {
    success: true as const,
    file: {
      id: data.id,
      name: data.name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  };
}
