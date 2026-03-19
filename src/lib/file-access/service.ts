/**
 * Phase 9: File access service.
 * Resolves file metadata, enforces ownership, gets provider token, delegates to adapter.
 * Split files: loads file_parts, fetches each part from provider, concatenates streams.
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
  is_split: boolean;
  viewer_mode: "inline" | "download_only";
};

type FilePartRow = {
  file_id: string;
  part_index: number;
  drive_id: string;
  provider_file_id: string;
  size_bytes: number;
};

export type ResolvedFileSingle = {
  fileId: string;
  name: string;
  mime: string | null;
  sizeBytes: number;
  viewerMode: "inline" | "download_only";
  isSplit: false;
  provider: AccountProvider;
  storageAccountId: string;
  providerFileId: string;
};

export type ResolvedFileSplit = {
  fileId: string;
  name: string;
  mime: string | null;
  sizeBytes: number;
  viewerMode: "inline" | "download_only";
  isSplit: true;
  parts: Array<{
    driveId: string;
    provider: AccountProvider;
    providerFileId: string;
    sizeBytes: number;
  }>;
};

export type ResolvedFileForAccess = ResolvedFileSingle | ResolvedFileSplit;

export type ResolvedFileForShareSingle = ResolvedFileSingle & {
  userId: string;
};

export type ResolvedFileForShareSplit = ResolvedFileSplit & {
  userId: string;
};

export type ResolvedFileForShareAccess = ResolvedFileForShareSingle | ResolvedFileForShareSplit;

/** Concatenate multiple ReadableStreams into one, in order. */
function concatStreams(
  streams: ReadableStream<Uint8Array>[],
): ReadableStream<Uint8Array> {
  let index = 0;
  const reader = {
    current: null as ReadableStreamDefaultReader<Uint8Array> | null,
    getNextReader(): ReadableStreamDefaultReader<Uint8Array> | null {
      if (index >= streams.length) return null;
      return streams[index++].getReader();
    },
  };

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (true) {
        if (!reader.current) {
          reader.current = reader.getNextReader();
          if (!reader.current) {
            controller.close();
            return;
          }
        }
        const { done, value } = await reader.current.read();
        if (done) {
          reader.current = null;
          continue;
        }
        if (value && value.length > 0) {
          controller.enqueue(value);
          return;
        }
      }
    },
    async cancel() {
      if (reader.current) await reader.current.cancel();
    },
  });
}

function parseInput<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid file id.", undefined);
  }
  return parsed.data as T;
}

/**
 * Resolve file by ID for share context. Uses service-role client, no user filter.
 * Caller must have already verified share token grants access to this file.
 */
export async function resolveFileForShareAccess(
  supabase: SupabaseClient,
  fileId: string,
): Promise<ResolvedFileForShareAccess> {
  const { data, error } = await supabase
    .from("files")
    .select(
      "id, user_id, name, mime, size_bytes, storage_provider, storage_account_id, provider_file_id_original, deleted_at, is_split, viewer_mode",
    )
    .eq("id", fileId)
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

  if (row.is_split) {
    const { data: partRows, error: partsError } = await supabase
      .from("file_parts")
      .select("file_id, part_index, drive_id, provider_file_id, size_bytes")
      .eq("file_id", row.id)
      .order("part_index", { ascending: true });

    if (partsError || !partRows?.length) {
      throw new ApiError(
        500,
        "FILE_ACCESS_FAILED",
        "Split file parts not found.",
        partsError?.message,
      );
    }

    const driveIds = [...new Set((partRows as FilePartRow[]).map((p) => p.drive_id))];
    const { data: accounts } = await supabase
      .from("linked_accounts")
      .select("id, provider")
      .in("id", driveIds);
    const providerByDrive = new Map(
      (accounts ?? []).map((a: { id: string; provider: AccountProvider }) => [a.id, a.provider]),
    );

    return {
      fileId: row.id,
      userId: row.user_id,
      name: row.name,
      mime: row.mime,
      sizeBytes: Number(row.size_bytes),
      viewerMode: (row.viewer_mode ?? "inline") as "inline" | "download_only",
      isSplit: true as const,
      parts: (partRows as FilePartRow[]).map((p) => ({
        driveId: p.drive_id,
        provider: providerByDrive.get(p.drive_id) as AccountProvider,
        providerFileId: p.provider_file_id,
        sizeBytes: Number(p.size_bytes),
      })),
    };
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
    userId: row.user_id,
    name: row.name,
    mime: row.mime,
    sizeBytes: Number(row.size_bytes),
    viewerMode: (row.viewer_mode ?? "inline") as "inline" | "download_only",
    isSplit: false as const,
    provider: row.storage_provider,
    storageAccountId: row.storage_account_id,
    providerFileId: row.provider_file_id_original,
  };
}

export async function resolveFileForAccess(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
): Promise<ResolvedFileForAccess> {
  const params = parseInput(fileIdParamsSchema, { id: fileId });

  const { data, error } = await supabase
    .from("files")
    .select(
      "id, user_id, name, mime, size_bytes, storage_provider, storage_account_id, provider_file_id_original, deleted_at, is_split, viewer_mode",
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

  if (row.is_split) {
    const { data: partRows, error: partsError } = await supabase
      .from("file_parts")
      .select("file_id, part_index, drive_id, provider_file_id, size_bytes")
      .eq("file_id", row.id)
      .order("part_index", { ascending: true });

    if (partsError || !partRows?.length) {
      throw new ApiError(
        500,
        "FILE_ACCESS_FAILED",
        "Split file parts not found.",
        partsError?.message,
      );
    }

    const driveIds = [...new Set((partRows as FilePartRow[]).map((p) => p.drive_id))];
    const { data: accounts } = await supabase
      .from("linked_accounts")
      .select("id, provider")
      .in("id", driveIds);
    const providerByDrive = new Map(
      (accounts ?? []).map((a: { id: string; provider: AccountProvider }) => [a.id, a.provider]),
    );

    return {
      fileId: row.id,
      name: row.name,
      mime: row.mime,
      sizeBytes: Number(row.size_bytes),
      viewerMode: (row.viewer_mode ?? "inline") as "inline" | "download_only",
      isSplit: true as const,
      parts: (partRows as FilePartRow[]).map((p) => ({
        driveId: p.drive_id,
        provider: providerByDrive.get(p.drive_id) as AccountProvider,
        providerFileId: p.provider_file_id,
        sizeBytes: Number(p.size_bytes),
      })),
    };
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
    viewerMode: (row.viewer_mode ?? "inline") as "inline" | "download_only",
    isSplit: false as const,
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
  opts?: { resolved?: ResolvedFileForAccess },
): Promise<FileAccessResult> {
  const resolved =
    opts?.resolved ?? (await resolveFileForAccess(supabase, userId, fileId));

  if (resolved.isSplit) {
    const streams: ReadableStream<Uint8Array>[] = [];
    for (const part of resolved.parts) {
      const tokenResult = await getUsableProviderToken(
        supabase,
        userId,
        part.driveId,
      );
      try {
        const result =
          part.provider === "gdrive"
            ? await downloadFromGoogleDrive({
                accessToken: tokenResult.accessToken,
                providerFileId: part.providerFileId,
                mimeType: resolved.mime,
              })
            : await downloadFromOneDrive({
                accessToken: tokenResult.accessToken,
                providerFileId: part.providerFileId,
              });
        streams.push(result.body);
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
              part.driveId,
              `File access (split part) failed: ${err.message}`,
            );
          }
        }
        throw err;
      }
    }

    await supabase.from("activity_logs").insert({
      user_id: userId,
      action: "file_access",
      resource_type: "file",
      resource_id: resolved.fileId,
      payload: { file_name: resolved.name, split: true, parts: resolved.parts.length },
    });

    return {
      body: concatStreams(streams),
      contentType: resolved.mime ?? "application/octet-stream",
      contentLength: resolved.sizeBytes,
      fileName: resolved.name,
    };
  }

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
            mimeType: resolved.mime,
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

/**
 * Stream file content for share context. Uses file owner's token.
 * Caller must have verified share token and that resource_type=file.
 */
export async function accessFileContentForShare(
  supabase: SupabaseClient,
  fileId: string,
  opts?: { resolved?: ResolvedFileForShareAccess },
): Promise<FileAccessResult> {
  const resolved =
    opts?.resolved ?? (await resolveFileForShareAccess(supabase, fileId));

  if (resolved.isSplit) {
    const streams: ReadableStream<Uint8Array>[] = [];
    for (const part of resolved.parts) {
      const tokenResult = await getUsableProviderToken(
        supabase,
        resolved.userId,
        part.driveId,
      );
      const result =
        part.provider === "gdrive"
          ? await downloadFromGoogleDrive({
              accessToken: tokenResult.accessToken,
              providerFileId: part.providerFileId,
              mimeType: resolved.mime,
            })
          : await downloadFromOneDrive({
              accessToken: tokenResult.accessToken,
              providerFileId: part.providerFileId,
            });
      streams.push(result.body);
    }
    return {
      body: concatStreams(streams),
      contentType: resolved.mime ?? "application/octet-stream",
      contentLength: resolved.sizeBytes,
      fileName: resolved.name,
    };
  }

  const tokenResult = await getUsableProviderToken(
    supabase,
    resolved.userId,
    resolved.storageAccountId,
  );

  const result =
    resolved.provider === "gdrive"
      ? await downloadFromGoogleDrive({
          accessToken: tokenResult.accessToken,
          providerFileId: resolved.providerFileId,
          mimeType: resolved.mime,
        })
      : await downloadFromOneDrive({
          accessToken: tokenResult.accessToken,
          providerFileId: resolved.providerFileId,
        });

  return {
    body: result.body,
    contentType: result.contentType,
    contentLength: result.contentLength,
    fileName: resolved.name,
  };
}

/**
 * Stream file content by provider context (accountId + providerFileId).
 * Used when opening a file from the unified explorer list that may not have an app file row yet.
 */
export async function accessFileContentByProvider(
  supabase: SupabaseClient,
  userId: string,
  accountId: string,
  providerFileId: string,
  options?: { fileName?: string; mimeType?: string | null },
): Promise<FileAccessResult> {
  const { data: account, error } = await supabase
    .from("linked_accounts")
    .select("id, provider")
    .eq("id", accountId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new ApiError(
      500,
      "FILE_ACCESS_FAILED",
      "Failed to resolve account.",
      error.message,
    );
  }
  if (!account) {
    throw new ApiError(404, "ACCOUNT_NOT_FOUND", "Storage account not found.");
  }

  const provider = account.provider as AccountProvider;
  const tokenResult = await getUsableProviderToken(
    supabase,
    userId,
    accountId,
  );

  try {
    const result =
      provider === "gdrive"
        ? await downloadFromGoogleDrive({
            accessToken: tokenResult.accessToken,
            providerFileId,
            mimeType: options?.mimeType ?? null,
          })
        : await downloadFromOneDrive({
            accessToken: tokenResult.accessToken,
            providerFileId,
          });

    return {
      body: result.body,
      contentType: result.contentType,
      contentLength: result.contentLength,
      fileName: options?.fileName ?? "file",
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
          accountId,
          `File access failed: ${err.message}`,
        );
      }
    }
    throw err;
  }
}
