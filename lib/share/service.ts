/**
 * Share links service.
 * Create, list, revoke share links with ownership verification.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import type {
  CreateShareRequest,
  CreateShareResponse,
  ListShareLinksResponse,
  ListSharedFolderResponse,
  RevokeShareResponse,
  ResolveShareResponse,
} from "@/lib/contracts/share.contracts";
import {
  createShareRequestSchema,
  createShareResponseSchema,
  listShareLinksResponseSchema,
  listSharedFolderResponseSchema,
  revokeShareResponseSchema,
  resolveShareResponseSchema,
} from "@/lib/contracts/share.contracts";

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

function generateToken(): string {
  return randomBytes(16).toString("base64url");
}

async function verifyResourceOwnership(
  supabase: SupabaseClient,
  userId: string,
  resourceType: "file" | "folder",
  resourceId: string,
): Promise<{ name: string }> {
  if (resourceType === "folder") {
    const { data, error } = await supabase
      .from("folders")
      .select("name")
      .eq("id", resourceId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .maybeSingle();
    if (error || !data) {
      throw new ApiError(403, "FORBIDDEN", "Folder not found or you do not own it.");
    }
    return { name: data.name };
  }

  const { data, error } = await supabase
    .from("files")
    .select("name")
    .eq("id", resourceId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) {
    throw new ApiError(403, "FORBIDDEN", "File not found or you do not own it.");
  }
  return { name: data.name };
}

export async function createShareLink(
  supabase: SupabaseClient,
  userId: string,
  request: CreateShareRequest,
): Promise<CreateShareResponse> {
  const parsed = parseInput(createShareRequestSchema, request);

  await verifyResourceOwnership(supabase, userId, parsed.resourceType, parsed.resourceId);

  const token = generateToken();
  const expiresAt = parsed.expiresAt ?? null;
  const allowDownload = parsed.allowDownload ?? true;

  const { data, error } = await supabase
    .from("share_links")
    .insert({
      user_id: userId,
      resource_type: parsed.resourceType,
      resource_id: parsed.resourceId,
      token,
      expires_at: expiresAt,
      allow_download: allowDownload,
    })
    .select("id, resource_type, resource_id, token, expires_at, allow_download, created_at")
    .single();

  if (error) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to create share link.", {
      dbError: error.message,
    });
  }

  return createShareResponseSchema.parse({
    success: true,
    shareLink: {
      id: data.id,
      resourceType: data.resource_type,
      resourceId: data.resource_id,
      token: data.token,
      expiresAt: data.expires_at ? normalizeTimestamp(data.expires_at) : null,
      allowDownload: data.allow_download,
      createdAt: normalizeTimestamp(data.created_at),
    },
  });
}

export async function listShareLinks(
  supabase: SupabaseClient,
  userId: string,
): Promise<ListShareLinksResponse> {
  const { data: links, error } = await supabase
    .from("share_links")
    .select("id, resource_type, resource_id, token, expires_at, allow_download, revoked_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to list share links.", {
      dbError: error.message,
    });
  }

  const shareLinks: ListShareLinksResponse["shareLinks"] = [];

  for (const link of links ?? []) {
    let resourceName = "Unknown";
    if (link.resource_type === "folder") {
      const { data: folder } = await supabase
        .from("folders")
        .select("name")
        .eq("id", link.resource_id)
        .eq("user_id", userId)
        .maybeSingle();
      resourceName = folder?.name ?? "Deleted folder";
    } else {
      const { data: file } = await supabase
        .from("files")
        .select("name")
        .eq("id", link.resource_id)
        .eq("user_id", userId)
        .maybeSingle();
      resourceName = file?.name ?? "Deleted file";
    }

    shareLinks.push({
      id: link.id,
      resourceType: link.resource_type,
      resourceId: link.resource_id,
      resourceName,
      token: link.token,
      expiresAt: link.expires_at ? normalizeTimestamp(link.expires_at) : null,
      allowDownload: link.allow_download,
      revokedAt: link.revoked_at ? normalizeTimestamp(link.revoked_at) : null,
      createdAt: normalizeTimestamp(link.created_at),
    });
  }

  return listShareLinksResponseSchema.parse({
    success: true,
    shareLinks,
  });
}

export async function revokeShareLink(
  supabase: SupabaseClient,
  userId: string,
  shareId: string,
): Promise<RevokeShareResponse> {
  const { data, error } = await supabase
    .from("share_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", shareId)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to revoke share link.", {
      dbError: error.message,
    });
  }

  if (!data) {
    throw new ApiError(404, "SHARE_LINK_NOT_FOUND", "Share link not found or you do not own it.");
  }

  return revokeShareResponseSchema.parse({ success: true });
}

/**
 * Resolve share by token. Uses a client that bypasses RLS (e.g. service role)
 * since this endpoint is public and unauthenticated users cannot read share_links.
 */
export async function resolveShareByToken(
  supabase: SupabaseClient,
  token: string,
): Promise<ResolveShareResponse> {
  const { data: link, error } = await supabase
    .from("share_links")
    .select("id, resource_type, resource_id, allow_download, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !link) {
    throw new ApiError(404, "SHARE_LINK_NOT_FOUND", "Share link not found.");
  }

  if (link.revoked_at) {
    throw new ApiError(410, "SHARE_LINK_REVOKED", "This share link has been revoked.");
  }

  if (link.expires_at && new Date(link.expires_at) < new Date()) {
    throw new ApiError(410, "SHARE_LINK_EXPIRED", "This share link has expired.");
  }

  let resourceName = "Unknown";
  if (link.resource_type === "folder") {
    const { data: folder } = await supabase
      .from("folders")
      .select("name")
      .eq("id", link.resource_id)
      .is("deleted_at", null)
      .maybeSingle();
    resourceName = folder?.name ?? "Deleted folder";
  } else {
    const { data: file } = await supabase
      .from("files")
      .select("name")
      .eq("id", link.resource_id)
      .is("deleted_at", null)
      .maybeSingle();
    resourceName = file?.name ?? "Deleted file";
  }

  return resolveShareResponseSchema.parse({
    success: true,
    shareLink: {
      id: link.id,
      resourceType: link.resource_type,
      resourceId: link.resource_id,
      resourceName,
      allowDownload: link.allow_download,
      expiresAt: link.expires_at ? normalizeTimestamp(link.expires_at) : null,
    },
  });
}

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
  storage_provider: string;
  storage_account_id: string | null;
  preview_status: string;
  sync_status: string;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * List shared folder contents. Uses service-role client; no user filter.
 * Caller must have verified share token and resource_type=folder.
 */
export async function listSharedFolderContents(
  supabase: SupabaseClient,
  folderId: string,
): Promise<ListSharedFolderResponse> {
  const [foldersResult, filesResult] = await Promise.all([
    supabase
      .from("folders")
      .select("id, parent_id, name, path, created_at, updated_at")
      .eq("parent_id", folderId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("files")
      .select(
        "id, folder_id, name, ext, mime, size_bytes, storage_provider, storage_account_id, preview_status, sync_status, error_code, created_at, updated_at",
      )
      .eq("folder_id", folderId)
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ]);

  if (foldersResult.error) {
    throw new ApiError(
      500,
      "FOLDERS_FETCH_FAILED",
      "Failed to fetch shared folder contents.",
      foldersResult.error.message,
    );
  }

  if (filesResult.error) {
    throw new ApiError(
      500,
      "FILES_FETCH_FAILED",
      "Failed to fetch shared folder contents.",
      filesResult.error.message,
    );
  }

  const folders = (foldersResult.data ?? []).map((row) => {
    const r = row as FolderRow;
    return {
      id: r.id,
      parentId: r.parent_id,
      name: r.name,
      path: r.path,
      createdAt: normalizeTimestamp(r.created_at),
      updatedAt: normalizeTimestamp(r.updated_at),
    };
  });

  const files = (filesResult.data ?? []).map((row) => {
    const r = row as FileRow;
    return {
      id: r.id,
      folderId: r.folder_id,
      name: r.name,
      ext: r.ext,
      mime: r.mime,
      sizeBytes: Number(r.size_bytes),
      provider: r.storage_provider,
      storageAccountId: r.storage_account_id,
      previewStatus: r.preview_status,
      syncStatus: r.sync_status,
      errorCode: r.error_code?.trim() || null,
      createdAt: normalizeTimestamp(r.created_at),
      updatedAt: normalizeTimestamp(r.updated_at),
    };
  });

  return listSharedFolderResponseSchema.parse({
    success: true,
    folders,
    files,
    total: folders.length + files.length,
  });
}

/**
 * Verify that a file is within a shared folder (root or descendant).
 * Caller must have verified share token and resource_type=folder.
 */
export async function verifyFileInSharedFolder(
  supabase: SupabaseClient,
  shareRootFolderId: string,
  fileId: string,
): Promise<void> {
  const { data: file, error: fileError } = await supabase
    .from("files")
    .select("id, folder_id")
    .eq("id", fileId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fileError || !file) {
    throw new ApiError(404, "FILE_NOT_FOUND", "File not found.");
  }

  const folderId = (file as { folder_id: string | null }).folder_id;
  if (!folderId) {
    throw new ApiError(403, "ACCESS_DENIED", "File is not in a folder.");
  }

  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id, path")
    .eq("id", folderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (folderError || !folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "File folder not found.");
  }

  const { data: rootFolder } = await supabase
    .from("folders")
    .select("path")
    .eq("id", shareRootFolderId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!rootFolder) {
    throw new ApiError(404, "SHARE_ROOT_NOT_FOUND", "Shared folder no longer exists.");
  }

  const rootPath = (rootFolder as { path: string }).path;
  const childPath = (folder as { path: string }).path;
  const isSameOrDescendant =
    childPath === rootPath || childPath.startsWith(`${rootPath}/`);

  if (!isSameOrDescendant) {
    throw new ApiError(403, "ACCESS_DENIED", "File is not within the shared folder.");
  }
}
