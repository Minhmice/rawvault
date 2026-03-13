/**
 * Phase 6: Upload execution orchestration.
 * Validates → dispatch → token → provider upload → metadata persistence → log.
 * Never writes metadata before provider success.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

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

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid upload request.", {
      fields: z.flattenError(parsed.error).fieldErrors,
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

export async function executeUpload(
  supabase: SupabaseClient,
  userId: string,
  request: UploadExecuteRequest,
  fileBody: ArrayBuffer,
): Promise<UploadExecuteSuccessResponse> {
  const parsed = parseInput(uploadExecuteRequestSchema, request);

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

  const dispatchResult = await dispatchUploadTarget(supabase, userId, {
    fileName: parsed.fileName,
    sizeBytes: parsed.sizeBytes,
    mime: parsed.mime,
    folderId: parsed.folderId,
    preferredProvider: parsed.preferredProvider,
    preferredAccountId: parsed.preferredAccountId,
  });

  const { provider, storageAccountId } = dispatchResult.dispatch;

  const tokenResult = await getUsableProviderToken(supabase, userId, storageAccountId);
  const accessToken = tokenResult.accessToken;

  // MVP: folderId is app-level only; provider APIs need provider folder IDs.
  // Upload to provider root; folder_id in metadata for app organization.
  const adapterInput = {
    accessToken,
    fileName: parsed.fileName,
    mime: parsed.mime ?? null,
    body: fileBody,
    sizeBytes: parsed.sizeBytes,
    parentFolderId: null as string | null,
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
  const insertPayload = {
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

  const { data: fileRow, error: insertError } = await supabase
    .from("files")
    .insert(insertPayload)
    .select("id, name, created_at, updated_at")
    .single();

  if (insertError) {
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
          error: insertError.message,
        },
      });
    } catch {
      /* best effort; always throw the canonical ApiError */
    }
    throw new ApiError(
      500,
      "METADATA_PERSISTENCE_FAILED",
      "File uploaded to provider but metadata persistence failed. Contact support.",
      { providerFileId: providerResult.providerFileId },
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
