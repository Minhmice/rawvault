import { z } from "zod";

export const createExplorerFolderRequestSchema = z.object({
  accountId: z.string().uuid(),
  providerFolderId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(255),
});

export const createExplorerFolderResponseSchema = z.object({
  success: z.literal(true),
  providerFolderId: z.string().min(1),
});

export type CreateExplorerFolderRequest = z.infer<typeof createExplorerFolderRequestSchema>;
export type CreateExplorerFolderResponse = z.infer<typeof createExplorerFolderResponseSchema>;
