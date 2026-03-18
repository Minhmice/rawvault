import { z } from "zod";

export const previewKindSchema = z.enum([
  "image",
  "pdf",
  "raw_embedded",
  "audio",
  "video",
  "google_redirect",
  "office_fallback",
  "unsupported",
]);

export const previewUnsupportedReasonSchema = z.enum([
  "too_large",
  "unknown_type",
  "html_svg_blocked",
  "split_file",
]);

// Size caps in bytes
export const PREVIEW_SIZE_CAPS = {
  image: 100 * 1024 * 1024,      // 100 MB
  raw_embedded: 100 * 1024 * 1024, // 100 MB
  pdf: 50 * 1024 * 1024,          // 50 MB
  audio: 50 * 1024 * 1024,        // 50 MB
  video: 200 * 1024 * 1024,       // 200 MB
} as const;

export const previewSourceSchema = z.object({
  /** App file ID (for /api/files/{id}/stream) — present for app-tracked files */
  fileId: z.string().uuid().optional(),
  /** Provider file ID (for Drive open?id=) — present for all Drive files */
  providerFileId: z.string().optional(),
  /** Provider (gdrive | onedrive) */
  provider: z.enum(["gdrive", "onedrive"]).optional(),
  /** Stream URL — /api/files/{id}/stream or /api/explorer/stream?... */
  streamUrl: z.string().optional(),
  /** Download URL — /api/files/{id}/download */
  downloadUrl: z.string().optional(),
});

export const previewModelSchema = z.object({
  kind: previewKindSchema,
  title: z.string(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().nonnegative().nullable(),
  source: previewSourceSchema,
  /** Only set when kind === "unsupported" */
  unsupportedReason: previewUnsupportedReasonSchema.optional(),
});

export type PreviewKind = z.infer<typeof previewKindSchema>;
export type PreviewUnsupportedReason = z.infer<typeof previewUnsupportedReasonSchema>;
export type PreviewSource = z.infer<typeof previewSourceSchema>;
export type PreviewModel = z.infer<typeof previewModelSchema>;
