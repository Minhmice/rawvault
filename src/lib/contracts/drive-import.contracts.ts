import { z } from "zod";

export const driveImportFolderRequestSchema = z.object({
  accountId: z.string().uuid(),
  providerFolderId: z.string().min(1),
  name: z.string().trim().min(1).max(255),
  parentFolderId: z.string().uuid().nullable().optional(),
});

export const driveImportFileRequestSchema = z.object({
  accountId: z.string().uuid(),
  providerFileId: z.string().min(1),
  name: z.string().trim().min(1).max(255),
  folderId: z.string().uuid().nullable().optional(),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().nullable().optional(),
});

export type DriveImportFolderRequest = z.infer<typeof driveImportFolderRequestSchema>;
export type DriveImportFileRequest = z.infer<typeof driveImportFileRequestSchema>;
