import { z } from "zod";

import { accountProviderSchema } from "./storage-account.contracts";

const sizeBytesSchema = z.coerce.number().int().nonnegative();
const mimeSchema = z.string().min(1).max(255);

export const filePreviewStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const fileSyncStatusSchema = z.enum([
  "pending",
  "syncing",
  "synced",
  "failed",
]);

export const fileSortBySchema = z.enum([
  "name",
  "createdAt",
  "updatedAt",
  "sizeBytes",
]);

export const sortOrderSchema = z.enum(["asc", "desc"]);

export const explorerFolderSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1).max(255),
  path: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listFoldersQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
});

export const listFoldersResponseSchema = z.object({
  success: z.literal(true),
  folders: z.array(explorerFolderSchema),
  total: z.number().int().nonnegative(),
});

export const listFilesQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(255).optional(),
  provider: accountProviderSchema.optional(),
  previewStatus: filePreviewStatusSchema.optional(),
  sortBy: fileSortBySchema.default("updatedAt"),
  sortOrder: sortOrderSchema.default("desc"),
});

export const explorerFileSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
  name: z.string().min(1).max(255),
  ext: z.string().min(1).max(20).nullable(),
  mime: mimeSchema.nullable(),
  sizeBytes: sizeBytesSchema,
  provider: accountProviderSchema,
  storageAccountId: z.string().uuid().nullable(),
  previewStatus: filePreviewStatusSchema,
  syncStatus: fileSyncStatusSchema,
  errorCode: z.string().min(1).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const listFilesResponseSchema = z.object({
  success: z.literal(true),
  files: z.array(explorerFileSchema),
  total: z.number().int().nonnegative(),
});

export const fileIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const folderIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const getFileResponseSchema = z.object({
  success: z.literal(true),
  file: explorerFileSchema,
});

export const explorerSortSchema = z.object({
  field: fileSortBySchema,
  direction: sortOrderSchema,
});

export const explorerFilterSchema = z.object({
  query: z.string().min(1).max(255).optional(),
  itemType: z.enum(["all", "folder", "file"]).optional(),
  providers: z.array(accountProviderSchema).min(1).optional(),
  previewStatuses: z.array(filePreviewStatusSchema).min(1).optional(),
  syncStatuses: z.array(fileSyncStatusSchema).min(1).optional(),
  extensions: z.array(z.string().min(1).max(20)).min(1).optional(),
  favoritesOnly: z.boolean().optional(),
  includeDeleted: z.boolean().optional(),
});

export const explorerCursorSchema = z.string().min(1);

export const explorerPageRequestSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: explorerCursorSchema.optional(),
});

export const explorerListRequestSchema = z.object({
  folderId: z.string().uuid().nullable().optional(),
  sort: explorerSortSchema.optional(),
  filter: explorerFilterSchema.optional(),
  page: explorerPageRequestSchema.optional(),
});

const explorerItemBaseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  isFavorite: z.boolean(),
  isPinned: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const explorerFolderItemSchema = explorerItemBaseSchema.extend({
  kind: z.literal("folder"),
  parentId: z.string().uuid().nullable(),
  path: z.string().min(1),
});

export const explorerFileItemSchema = explorerItemBaseSchema.extend({
  kind: z.literal("file"),
  folderId: z.string().uuid().nullable(),
  ext: z.string().min(1).max(20).nullable(),
  mime: mimeSchema.nullable(),
  sizeBytes: sizeBytesSchema,
  storageProvider: accountProviderSchema,
  storageAccountId: z.string().uuid().nullable(),
  previewStatus: filePreviewStatusSchema,
  syncStatus: fileSyncStatusSchema,
  errorCode: z.string().min(1).nullable(),
});

export const explorerItemSchema = z.discriminatedUnion("kind", [
  explorerFolderItemSchema,
  explorerFileItemSchema,
]);

export const explorerPageResponseSchema = z.object({
  nextCursor: explorerCursorSchema.nullable(),
  hasMore: z.boolean(),
  limit: z.coerce.number().int().min(1).max(200),
});

export const explorerListResponseSchema = z.object({
  success: z.literal(true),
  items: z.array(explorerItemSchema),
  page: explorerPageResponseSchema,
});

export type FilePreviewStatus = z.infer<typeof filePreviewStatusSchema>;
export type FileSyncStatus = z.infer<typeof fileSyncStatusSchema>;
export type FileSortBy = z.infer<typeof fileSortBySchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type ExplorerFolder = z.infer<typeof explorerFolderSchema>;
export type ListFoldersQuery = z.infer<typeof listFoldersQuerySchema>;
export type ListFoldersResponse = z.infer<typeof listFoldersResponseSchema>;
export type ExplorerFile = z.infer<typeof explorerFileSchema>;
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
export type ListFilesResponse = z.infer<typeof listFilesResponseSchema>;
export type FileIdParams = z.infer<typeof fileIdParamsSchema>;
export type GetFileResponse = z.infer<typeof getFileResponseSchema>;
export type ExplorerSort = z.infer<typeof explorerSortSchema>;
export type ExplorerFilter = z.infer<typeof explorerFilterSchema>;
export type ExplorerCursor = z.infer<typeof explorerCursorSchema>;
export type ExplorerPageRequest = z.infer<typeof explorerPageRequestSchema>;
export type ExplorerFolderItem = z.infer<typeof explorerFolderItemSchema>;
export type ExplorerFileItem = z.infer<typeof explorerFileItemSchema>;
export type ExplorerItem = z.infer<typeof explorerItemSchema>;
export type ExplorerPageResponse = z.infer<typeof explorerPageResponseSchema>;
export type ExplorerListRequest = z.infer<typeof explorerListRequestSchema>;
export type ExplorerListResponse = z.infer<typeof explorerListResponseSchema>;
