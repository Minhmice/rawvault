import { z } from "zod";

export const driveBrowseItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  isFolder: z.boolean(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
});

export const driveBrowseQuerySchema = z.object({
  accountId: z.string().uuid(),
  folderId: z.string().min(1).optional(),
});

export const driveBrowseResponseSchema = z.object({
  success: z.literal(true),
  folders: z.array(driveBrowseItemSchema),
  files: z.array(driveBrowseItemSchema),
});

export type DriveBrowseItem = z.infer<typeof driveBrowseItemSchema>;
export type DriveBrowseQuery = z.infer<typeof driveBrowseQuerySchema>;
export type DriveBrowseResponse = z.infer<typeof driveBrowseResponseSchema>;
