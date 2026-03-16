import { z } from "zod";

/** Single item from unified explorer list (provider-native, with account context). */
export const unifiedExplorerItemSchema = z.object({
  accountId: z.string().uuid(),
  providerId: z.string().min(1),
  name: z.string(),
  isFolder: z.boolean(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
});

export const unifiedExplorerListQuerySchema = z.object({
  /** When omitted with providerFolderId: My Drive for all accounts. */
  accountId: z.string().uuid().optional(),
  /** When omitted with accountId: root of that account. When both omitted: My Drive (all accounts). */
  providerFolderId: z.string().min(1).optional(),
});

export const unifiedExplorerListResponseSchema = z.object({
  success: z.literal(true),
  folders: z.array(unifiedExplorerItemSchema),
  files: z.array(unifiedExplorerItemSchema),
});

export type UnifiedExplorerItem = z.infer<typeof unifiedExplorerItemSchema>;
export type UnifiedExplorerListQuery = z.infer<typeof unifiedExplorerListQuerySchema>;
export type UnifiedExplorerListResponse = z.infer<typeof unifiedExplorerListResponseSchema>;
