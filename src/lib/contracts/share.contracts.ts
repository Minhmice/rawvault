import { z } from "zod";

export const shareResourceTypeSchema = z.enum(["file", "folder"]);
export type ShareResourceType = z.infer<typeof shareResourceTypeSchema>;

/** Request body for POST /api/share. Accepts snake_case (API) or camelCase. */
export const createShareRequestSchema = z
  .object({
    resource_type: shareResourceTypeSchema.optional(),
    resource_id: z.string().uuid().optional(),
    resourceType: shareResourceTypeSchema.optional(),
    resourceId: z.string().uuid().optional(),
    expires_at: z.string().datetime().nullable().optional(),
    allow_download: z.boolean().optional(),
    expiresAt: z.string().datetime().nullable().optional(),
    allowDownload: z.boolean().optional(),
  })
  .refine(
    (d) => (d.resource_type ?? d.resourceType) != null && (d.resource_id ?? d.resourceId) != null,
    { message: "resource_type and resource_id required" },
  )
  .transform((d) => ({
    resourceType: d.resource_type ?? d.resourceType!,
    resourceId: d.resource_id ?? d.resourceId!,
    expiresAt: d.expires_at ?? d.expiresAt ?? null,
    allowDownload: d.allow_download ?? d.allowDownload ?? true,
  }));

export type CreateShareRequest = z.infer<typeof createShareRequestSchema>;

/** Share link in create response (no resourceName, revokedAt) */
export const createShareLinkSchema = z.object({
  id: z.string().uuid(),
  resourceType: shareResourceTypeSchema,
  resourceId: z.string().uuid(),
  token: z.string().min(1),
  expiresAt: z.string().datetime().nullable(),
  allowDownload: z.boolean(),
  createdAt: z.string().datetime(),
});

/** Share link in list response (includes resourceName, revokedAt) */
export const shareLinkSchema = z.object({
  id: z.string().uuid(),
  resourceType: shareResourceTypeSchema,
  resourceId: z.string().uuid(),
  resourceName: z.string().min(1),
  token: z.string().min(1),
  expiresAt: z.string().datetime().nullable(),
  allowDownload: z.boolean(),
  revokedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type ShareLink = z.infer<typeof shareLinkSchema>;

export const listShareLinksResponseSchema = z.object({
  success: z.literal(true),
  shareLinks: z.array(shareLinkSchema),
});
export type ListShareLinksResponse = z.infer<typeof listShareLinksResponseSchema>;

export const createShareResponseSchema = z.object({
  success: z.literal(true),
  shareLink: createShareLinkSchema,
});
export type CreateShareResponse = z.infer<typeof createShareResponseSchema>;

export const revokeShareResponseSchema = z.object({
  success: z.literal(true),
});
export type RevokeShareResponse = z.infer<typeof revokeShareResponseSchema>;

/** Resolve share response (public, no auth) */
export const resolveShareLinkSchema = z.object({
  id: z.string().uuid(),
  resourceType: shareResourceTypeSchema,
  resourceId: z.string().uuid(),
  resourceName: z.string().min(1),
  allowDownload: z.boolean(),
  expiresAt: z.string().datetime().nullable(),
});

export const resolveShareResponseSchema = z.object({
  success: z.literal(true),
  shareLink: resolveShareLinkSchema,
});
export type ResolveShareResponse = z.infer<typeof resolveShareResponseSchema>;

/** Shared folder list item (compatible with explorer shape) */
export const sharedFolderItemSchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  name: z.string().min(1),
  path: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SharedFolderItem = z.infer<typeof sharedFolderItemSchema>;

/** Shared file list item (compatible with explorer shape) */
export const sharedFileItemSchema = z.object({
  id: z.string().uuid(),
  folderId: z.string().uuid().nullable(),
  name: z.string().min(1),
  ext: z.string().nullable(),
  mime: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  provider: z.enum(["gdrive", "onedrive"]),
  storageAccountId: z.string().uuid().nullable(),
  previewStatus: z.enum(["pending", "processing", "ready", "failed"]),
  syncStatus: z.enum(["pending", "syncing", "synced", "failed"]),
  errorCode: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SharedFileItem = z.infer<typeof sharedFileItemSchema>;

export const listSharedFolderResponseSchema = z.object({
  success: z.literal(true),
  folders: z.array(sharedFolderItemSchema),
  files: z.array(sharedFileItemSchema),
  total: z.number().int().nonnegative(),
});
export type ListSharedFolderResponse = z.infer<typeof listSharedFolderResponseSchema>;
