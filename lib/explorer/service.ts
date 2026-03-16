import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type {
  AccountProvider,
  FileIdParams,
  FilePreviewStatus,
  FileSyncStatus,
  GetFileResponse,
  ListFilesQuery,
  ListFilesResponse,
  ListFoldersQuery,
  ListFoldersResponse,
} from "@/lib/contracts";
import {
  fileIdParamsSchema,
  getFileResponseSchema,
  listFilesQuerySchema,
  listFilesResponseSchema,
  listFoldersQuerySchema,
  listFoldersResponseSchema,
} from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";

type FolderRow = {
  id: string;
  parent_id: string | null;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
};

type FileRow = {
  id: string;
  folder_id: string | null;
  name: string;
  ext: string | null;
  mime: string | null;
  size_bytes: number;
  storage_provider: AccountProvider;
  storage_account_id: string | null;
  preview_status: FilePreviewStatus;
  sync_status: FileSyncStatus;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

const fileSortMap: Record<ListFilesQuery["sortBy"], string> = {
  name: "name",
  createdAt: "created_at",
  updatedAt: "updated_at",
  sizeBytes: "size_bytes",
};

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request query.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  return parsed.data;
}

function normalizeTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

function normalizeFolder(row: FolderRow) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    path: row.path,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

function normalizeFile(row: FileRow) {
  return {
    id: row.id,
    folderId: row.folder_id,
    name: row.name,
    ext: row.ext,
    mime: row.mime,
    sizeBytes: row.size_bytes,
    provider: row.storage_provider,
    storageAccountId: row.storage_account_id,
    previewStatus: row.preview_status,
    syncStatus: row.sync_status,
    errorCode: row.error_code?.trim() || null,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

export function parseFoldersQuery(searchParams: URLSearchParams): ListFoldersQuery {
  return parseInput(listFoldersQuerySchema, {
    parentId: searchParams.get("parentId") ?? undefined,
  });
}

export function parseFilesQuery(searchParams: URLSearchParams): ListFilesQuery {
  const parsed = listFilesQuerySchema.safeParse({
    folderId: searchParams.get("folderId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    provider: searchParams.get("provider") ?? undefined,
    previewStatus: searchParams.get("previewStatus") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortOrder: searchParams.get("sortOrder") ?? undefined,
  });
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request query.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  return parsed.data;
}

export async function listExplorerFolders(
  supabase: SupabaseClient,
  userId: string,
  query: ListFoldersQuery,
): Promise<ListFoldersResponse> {
  let request = supabase
    .from("folders")
    .select("id, parent_id, name, path, created_at, updated_at", { count: "exact" })
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (query.parentId) {
    request = request.eq("parent_id", query.parentId);
  }

  const { data, count, error } = await request;

  if (error) {
    throw new ApiError(
      500,
      "FOLDERS_FETCH_FAILED",
      "Failed to fetch folders.",
      error.message,
    );
  }

  return listFoldersResponseSchema.parse({
    success: true,
    folders: (data ?? []).map((row) => normalizeFolder(row as FolderRow)),
    total: count ?? (data?.length ?? 0),
  });
}

/** Return linked account ids for the user. Used to hide files from unlinked accounts. */
async function getLinkedAccountIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("linked_accounts")
    .select("id")
    .eq("user_id", userId);
  if (error) return [];
  return (data ?? []).map((r: { id: string }) => r.id);
}

export async function listExplorerFiles(
  supabase: SupabaseClient,
  userId: string,
  query: ListFilesQuery,
): Promise<ListFilesResponse> {
  const linkedAccountIds = await getLinkedAccountIds(supabase, userId);
  // Only show files that belong to a currently linked account; after unlink, storage_account_id is set null
  if (linkedAccountIds.length === 0) {
    return listFilesResponseSchema.parse({
      success: true,
      files: [],
      total: 0,
    });
  }

  let request = supabase
    .from("files")
    .select(
      `
      id,
      folder_id,
      name,
      ext,
      mime,
      size_bytes,
      storage_provider,
      storage_account_id,
      preview_status,
      sync_status,
      error_code,
      created_at,
      updated_at
    `,
      { count: "exact" },
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .in("storage_account_id", linkedAccountIds);

  if (query.folderId) {
    request = request.eq("folder_id", query.folderId);
  }

  if (query.search) {
    request = request.ilike("name", `%${query.search}%`);
  }

  if (query.provider) {
    request = request.eq("storage_provider", query.provider);
  }

  if (query.previewStatus) {
    request = request.eq("preview_status", query.previewStatus);
  }

  const { data, count, error } = await request.order(fileSortMap[query.sortBy], {
    ascending: query.sortOrder === "asc",
  });

  if (error) {
    throw new ApiError(
      500,
      "FILES_FETCH_FAILED",
      "Failed to fetch files.",
      error.message,
    );
  }

  return listFilesResponseSchema.parse({
    success: true,
    files: (data ?? []).map((row) => normalizeFile(row as FileRow)),
    total: count ?? (data?.length ?? 0),
  });
}

export async function getExplorerFile(
  supabase: SupabaseClient,
  userId: string,
  params: FileIdParams,
): Promise<GetFileResponse> {
  const parsed = parseInput(fileIdParamsSchema, params);

  const { data, error } = await supabase
    .from("files")
    .select(
      `
      id,
      folder_id,
      name,
      ext,
      mime,
      size_bytes,
      storage_provider,
      storage_account_id,
      preview_status,
      sync_status,
      error_code,
      created_at,
      updated_at
    `,
    )
    .eq("id", parsed.id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "FILE_FETCH_FAILED", "Failed to fetch file detail.", error.message);
  }

  if (!data) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  return getFileResponseSchema.parse({
    success: true,
    file: normalizeFile(data as FileRow),
  });
}
