/**
 * Phase 7: File and folder metadata management service.
 * Handles create, rename, move, soft delete, restore with ownership checks.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import type { AccountProvider, FilePreviewStatus, FileSyncStatus } from "@/lib/contracts";
import {
  createFolderRequestSchema,
  createFolderResponseSchema,
  renameFolderRequestSchema,
  moveFolderRequestSchema,
  deleteFolderResponseSchema,
  restoreFolderResponseSchema,
  renameFileRequestSchema,
  moveFileRequestSchema,
  restoreFileResponseSchema,
  deleteFileResponseSchema,
  getBreadcrumbResponseSchema,
  folderIdParamsSchema,
  fileIdParamsSchema,
} from "@/lib/contracts/metadata.contracts";
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

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request.", {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  return parsed.data;
}

function normalizeTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
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
    errorCode: row.error_code,
    createdAt: normalizeTimestamp(row.created_at),
    updatedAt: normalizeTimestamp(row.updated_at),
  };
}

/** Path computation: root = "/", child = parent_path + "/" + name */
export function computeFolderPath(parentPath: string | null, name: string): string {
  const base = parentPath ?? "/";
  return base === "/" ? `/${name}` : `${base}/${name}`;
}

async function writeActivityLog(
  supabase: SupabaseClient,
  userId: string,
  action: string,
  resourceType: "file" | "folder",
  resourceId: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await supabase.from("activity_logs").insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    payload,
  });
  if (error) {
    // Best-effort; do not fail the main operation
  }
}

async function getFolderOwned(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  includeDeleted = false,
): Promise<FolderRow | null> {
  let q = supabase
    .from("folders")
    .select("id, parent_id, name, path, created_at, updated_at")
    .eq("id", folderId)
    .eq("user_id", userId);
  if (!includeDeleted) q = q.is("deleted_at", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as FolderRow | null;
}

async function getFileOwned(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
  includeDeleted = false,
): Promise<FileRow | null> {
  let q = supabase
    .from("files")
    .select(
      "id, folder_id, name, ext, mime, size_bytes, storage_provider, storage_account_id, preview_status, sync_status, error_code, created_at, updated_at",
    )
    .eq("id", fileId)
    .eq("user_id", userId);
  if (!includeDeleted) q = q.is("deleted_at", null);
  const { data, error } = await q.maybeSingle();
  if (error) return null;
  return data as FileRow | null;
}

/** Check if targetId is a descendant of folderId (would create cycle) */
async function isDescendant(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  targetId: string,
): Promise<boolean> {
  let currentId: string | null = targetId;
  const seen = new Set<string>();
  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    if (currentId === folderId) return true;
    const folder = await getFolderOwned(supabase, userId, currentId);
    currentId = folder?.parent_id ?? null;
  }
  return false;
}

async function updateDescendantPaths(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  oldPathPrefix: string,
  newPathPrefix: string,
): Promise<void> {
  const { data: children } = await supabase
    .from("folders")
    .select("id, path")
    .eq("user_id", userId)
    .eq("parent_id", folderId)
    .is("deleted_at", null);

  if (!children?.length) return;

  for (const child of children as { id: string; path: string }[]) {
    const newPath = child.path.replace(oldPathPrefix, newPathPrefix);
    await supabase
      .from("folders")
      .update({ path: newPath, updated_at: new Date().toISOString() })
      .eq("id", child.id)
      .eq("user_id", userId);
    await updateDescendantPaths(supabase, userId, child.id, oldPathPrefix, newPathPrefix);
  }
}

export async function createFolder(
  supabase: SupabaseClient,
  userId: string,
  request: { name: string; parentId?: string | null },
): Promise<z.infer<typeof createFolderResponseSchema>> {
  const parsed = parseInput(createFolderRequestSchema, request);
  const parentId = parsed.parentId ?? null;

  let parentPath: string | null = null;
  if (parentId) {
    const parent = await getFolderOwned(supabase, userId, parentId);
    if (!parent) {
      throw new ApiError(404, "PARENT_NOT_FOUND", "Parent folder not found.");
    }
    parentPath = parent.path;
  }

  const path = computeFolderPath(parentPath, parsed.name);

  const { data, error } = await supabase
    .from("folders")
    .insert({
      user_id: userId,
      parent_id: parentId,
      name: parsed.name,
      path,
    })
    .select("id, parent_id, name, path, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FOLDER_NAME_CONFLICT", "A folder with this path already exists.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to create folder.", error.message);
  }

  await writeActivityLog(supabase, userId, "folder_created", "folder", data.id, {
    name: parsed.name,
    path,
  });

  return createFolderResponseSchema.parse({
    success: true,
    folder: normalizeFolder(data as FolderRow),
  });
}

export async function renameFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  request: { name: string },
): Promise<z.infer<typeof restoreFolderResponseSchema>> {
  parseInput(folderIdParamsSchema, { id: folderId });
  const parsed = parseInput(renameFolderRequestSchema, request);

  const folder = await getFolderOwned(supabase, userId, folderId);
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
  }

  const parentPath = folder.parent_id
    ? (await getFolderOwned(supabase, userId, folder.parent_id))?.path ?? "/"
    : "/";
  const newPath = computeFolderPath(parentPath, parsed.name);

  const { data, error } = await supabase
    .from("folders")
    .update({ name: parsed.name, path: newPath, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", userId)
    .select("id, parent_id, name, path, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FOLDER_NAME_CONFLICT", "A folder with this path already exists.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to rename folder.", error.message);
  }

  await updateDescendantPaths(supabase, userId, folderId, folder.path, newPath);

  await writeActivityLog(supabase, userId, "folder_renamed", "folder", folderId, {
    old_name: folder.name,
    new_name: parsed.name,
  });

  return restoreFolderResponseSchema.parse({
    success: true,
    folder: normalizeFolder(data as FolderRow),
  });
}

export async function moveFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
  request: { parentId: string | null },
): Promise<z.infer<typeof restoreFolderResponseSchema>> {
  parseInput(folderIdParamsSchema, { id: folderId });
  const parsed = parseInput(moveFolderRequestSchema, request);

  const folder = await getFolderOwned(supabase, userId, folderId);
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
  }

  if (parsed.parentId === folderId) {
    throw new ApiError(400, "FOLDER_CYCLE", "Cannot move folder into itself.");
  }

  if (parsed.parentId) {
    const isDesc = await isDescendant(supabase, userId, folderId, parsed.parentId);
    if (isDesc) {
      throw new ApiError(400, "FOLDER_CYCLE", "Cannot move folder into its own descendant.");
    }
    const target = await getFolderOwned(supabase, userId, parsed.parentId);
    if (!target) {
      throw new ApiError(404, "PARENT_NOT_FOUND", "Target parent folder not found.");
    }
  }

  const parentPath = parsed.parentId
    ? (await getFolderOwned(supabase, userId, parsed.parentId))?.path ?? "/"
    : "/";
  const newPath = computeFolderPath(parentPath, folder.name);

  const { data, error } = await supabase
    .from("folders")
    .update({
      parent_id: parsed.parentId,
      path: newPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", folderId)
    .eq("user_id", userId)
    .select("id, parent_id, name, path, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FOLDER_NAME_CONFLICT", "A folder with this path already exists.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to move folder.", error.message);
  }

  await updateDescendantPaths(supabase, userId, folderId, folder.path, newPath);

  await writeActivityLog(supabase, userId, "folder_moved", "folder", folderId, {
    old_parent_id: folder.parent_id,
    new_parent_id: parsed.parentId,
  });

  return restoreFolderResponseSchema.parse({
    success: true,
    folder: normalizeFolder(data as FolderRow),
  });
}

export async function softDeleteFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<z.infer<typeof deleteFolderResponseSchema>> {
  parseInput(folderIdParamsSchema, { id: folderId });

  const folder = await getFolderOwned(supabase, userId, folderId);
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("folders")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", folderId)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to delete folder.", error.message);
  }

  // Soft-delete all descendants (path starts with folder.path + "/")
  const pathPrefix = `${folder.path}/`;
  const { data: descendants } = await supabase
    .from("folders")
    .select("id")
    .eq("user_id", userId)
    .like("path", `${pathPrefix}%`);
  if (descendants?.length) {
    const ids = (descendants as { id: string }[]).map((d) => d.id);
    await supabase
      .from("folders")
      .update({ deleted_at: now, updated_at: now })
      .in("id", ids)
      .eq("user_id", userId);
  }

  await writeActivityLog(supabase, userId, "folder_deleted", "folder", folderId, {});

  return deleteFolderResponseSchema.parse({ success: true });
}

export async function restoreFolder(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<z.infer<typeof restoreFolderResponseSchema>> {
  parseInput(folderIdParamsSchema, { id: folderId });

  const folder = await getFolderOwned(supabase, userId, folderId, true);
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
  }
  if (!folder.parent_id) {
    // Already had no parent; just clear deleted_at
  }

  const { data, error } = await supabase
    .from("folders")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", folderId)
    .eq("user_id", userId)
    .select("id, parent_id, name, path, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FOLDER_NAME_CONFLICT", "A folder with this path already exists. Cannot restore.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to restore folder.", error.message);
  }

  await writeActivityLog(supabase, userId, "folder_restored", "folder", folderId, {});

  return restoreFolderResponseSchema.parse({
    success: true,
    folder: normalizeFolder(data as FolderRow),
  });
}

export async function renameFile(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
  request: { name: string },
): Promise<z.infer<typeof restoreFileResponseSchema>> {
  parseInput(fileIdParamsSchema, { id: fileId });
  const parsed = parseInput(renameFileRequestSchema, request);

  const file = await getFileOwned(supabase, userId, fileId);
  if (!file) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const { data, error } = await supabase
    .from("files")
    .update({ name: parsed.name, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select(
      "id, folder_id, name, ext, mime, size_bytes, storage_provider, storage_account_id, preview_status, sync_status, error_code, created_at, updated_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FILE_NAME_CONFLICT", "A file with this name already exists in this folder.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to rename file.", error.message);
  }

  await writeActivityLog(supabase, userId, "file_renamed", "file", fileId, {
    old_name: file.name,
    new_name: parsed.name,
  });

  return restoreFileResponseSchema.parse({
    success: true,
    file: normalizeFile(data as FileRow),
  });
}

export async function moveFile(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
  request: { folderId: string | null },
): Promise<z.infer<typeof restoreFileResponseSchema>> {
  parseInput(fileIdParamsSchema, { id: fileId });
  const parsed = parseInput(moveFileRequestSchema, request);

  const file = await getFileOwned(supabase, userId, fileId);
  if (!file) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  if (parsed.folderId) {
    const target = await getFolderOwned(supabase, userId, parsed.folderId);
    if (!target) {
      throw new ApiError(404, "PARENT_NOT_FOUND", "Target folder not found.");
    }
  }

  const { data, error } = await supabase
    .from("files")
    .update({ folder_id: parsed.folderId, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select(
      "id, folder_id, name, ext, mime, size_bytes, storage_provider, storage_account_id, preview_status, sync_status, error_code, created_at, updated_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FILE_NAME_CONFLICT", "A file with this name already exists in the target folder.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to move file.", error.message);
  }

  await writeActivityLog(supabase, userId, "file_moved", "file", fileId, {
    old_folder_id: file.folder_id,
    new_folder_id: parsed.folderId,
  });

  return restoreFileResponseSchema.parse({
    success: true,
    file: normalizeFile(data as FileRow),
  });
}

export async function softDeleteFile(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
): Promise<z.infer<typeof deleteFileResponseSchema>> {
  parseInput(fileIdParamsSchema, { id: fileId });

  const file = await getFileOwned(supabase, userId, fileId);
  if (!file) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("files")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", fileId)
    .eq("user_id", userId);

  if (error) {
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to delete file.", error.message);
  }

  await writeActivityLog(supabase, userId, "file_deleted", "file", fileId, {});

  return deleteFileResponseSchema.parse({ success: true });
}

export async function restoreFile(
  supabase: SupabaseClient,
  userId: string,
  fileId: string,
): Promise<z.infer<typeof restoreFileResponseSchema>> {
  parseInput(fileIdParamsSchema, { id: fileId });

  const file = await getFileOwned(supabase, userId, fileId, true);
  if (!file) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const { data, error } = await supabase
    .from("files")
    .update({ deleted_at: null, updated_at: new Date().toISOString() })
    .eq("id", fileId)
    .eq("user_id", userId)
    .select(
      "id, folder_id, name, ext, mime, size_bytes, storage_provider, storage_account_id, preview_status, sync_status, error_code, created_at, updated_at",
    )
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "FILE_NAME_CONFLICT", "A file with this name already exists in the folder. Cannot restore.");
    }
    throw new ApiError(500, "METADATA_UPDATE_FAILED", "Failed to restore file.", error.message);
  }

  await writeActivityLog(supabase, userId, "file_restored", "file", fileId, {});

  return restoreFileResponseSchema.parse({
    success: true,
    file: normalizeFile(data as FileRow),
  });
}

export async function getFolderBreadcrumb(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<z.infer<typeof getBreadcrumbResponseSchema>> {
  parseInput(folderIdParamsSchema, { id: folderId });

  const folder = await getFolderOwned(supabase, userId, folderId);
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
  }

  let currentId: string | null = folderId;
  const chain: { id: string; name: string }[] = [];

  while (currentId) {
    const f = await getFolderOwned(supabase, userId, currentId);
    if (!f) break;
    chain.unshift({ id: f.id, name: f.name });
    currentId = f.parent_id;
  }

  return getBreadcrumbResponseSchema.parse({
    success: true,
    items: chain,
  });
}
