/**
 * Phase 7: File and folder metadata operation contracts.
 * Canonical request/response schemas for create, rename, move, soft delete, restore.
 * Single source of truth — routes and frontend must use these shapes.
 */

import { z } from "zod";

import {
  explorerFileSchema,
  explorerFolderSchema,
  fileIdParamsSchema,
  folderIdParamsSchema,
} from "./explorer.contracts";

// Re-export for metadata routes (same shape as explorer param schemas)
export { fileIdParamsSchema, folderIdParamsSchema };

const nameSchema = z.string().trim().min(1).max(255);

// ---- Folder ----

export const createFolderRequestSchema = z.object({
  name: nameSchema,
  parentId: z.string().uuid().nullish(),
});

export const createFolderResponseSchema = z.object({
  success: z.literal(true),
  folder: explorerFolderSchema,
});

export const renameFolderRequestSchema = z.object({
  name: nameSchema,
});

export const moveFolderRequestSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export const deleteFolderResponseSchema = z.object({
  success: z.literal(true),
});

export const restoreFolderResponseSchema = z.object({
  success: z.literal(true),
  folder: explorerFolderSchema,
});

// ---- File ----

export const renameFileRequestSchema = z.object({
  name: nameSchema,
});

export const moveFileRequestSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

export const restoreFileResponseSchema = z.object({
  success: z.literal(true),
  file: explorerFileSchema,
});

export const deleteFileResponseSchema = z.object({
  success: z.literal(true),
});

/** Alias for delete responses (folder and file have same shape). */
export const deleteSuccessResponseSchema = deleteFolderResponseSchema;

/** Alias for folder mutation responses (rename, move, restore). */
export const folderMutationResponseSchema = restoreFolderResponseSchema;

/** Alias for file mutation responses (rename, move, restore). */
export const fileMutationResponseSchema = restoreFileResponseSchema;

// ---- Breadcrumb ----

export const breadcrumbItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  /** Explorer mode: segment points to (accountId, providerFolderId). Null = root (My Drive). */
  accountId: z.string().uuid().nullable().optional(),
  providerFolderId: z.string().min(1).nullable().optional(),
});

export const getBreadcrumbResponseSchema = z.object({
  success: z.literal(true),
  items: z.array(breadcrumbItemSchema),
});

// ---- Metadata error codes ----

/**
 * Canonical error codes for folder/file metadata operations.
 * Single source of truth — routes and clients must use these codes.
 */
export const metadataErrorCodeSchema = z.enum([
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FOLDER_NOT_FOUND",
  "FILE_NOT_FOUND",
  "FOLDER_NAME_CONFLICT",
  "FILE_NAME_CONFLICT",
  "FOLDER_CYCLE",
  "PARENT_NOT_FOUND",
  "FOLDER_FETCH_FAILED",
  "FILES_FETCH_FAILED",
  "FILE_FETCH_FAILED",
  "METADATA_UPDATE_FAILED",
  "INTERNAL_SERVER_ERROR",
  "UNKNOWN_ERROR",
]);

/**
 * Canonical error response for metadata routes.
 * Shape: { error: { code, message, details? } } — code from metadataErrorCodeSchema.
 */
export const metadataErrorResponseSchema = z.object({
  error: z.object({
    code: metadataErrorCodeSchema,
    message: z.string().min(1),
    details: z.unknown().optional(),
  }),
});

// ---- Type exports ----

export type CreateFolderRequest = z.infer<typeof createFolderRequestSchema>;
export type CreateFolderResponse = z.infer<typeof createFolderResponseSchema>;
export type RenameFolderRequest = z.infer<typeof renameFolderRequestSchema>;
export type MoveFolderRequest = z.infer<typeof moveFolderRequestSchema>;
export type DeleteFolderResponse = z.infer<typeof deleteFolderResponseSchema>;
export type RestoreFolderResponse = z.infer<typeof restoreFolderResponseSchema>;

export type RenameFileRequest = z.infer<typeof renameFileRequestSchema>;
export type MoveFileRequest = z.infer<typeof moveFileRequestSchema>;
export type DeleteFileResponse = z.infer<typeof deleteFileResponseSchema>;
export type RestoreFileResponse = z.infer<typeof restoreFileResponseSchema>;

export type BreadcrumbItem = z.infer<typeof breadcrumbItemSchema>;
export type GetBreadcrumbResponse = z.infer<typeof getBreadcrumbResponseSchema>;

export type FolderIdParams = z.infer<typeof folderIdParamsSchema>;
export type MetadataErrorCode = z.infer<typeof metadataErrorCodeSchema>;
export type MetadataErrorResponse = z.infer<typeof metadataErrorResponseSchema>;
