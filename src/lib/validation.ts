import { z } from "zod";

// File config
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const ALLOWED_EXTENSIONS = [
  "raw", "arw", "cr2", "cr3", "nef", "nrw", "orf", "rw2", "pef", "srw",
  "dng", "raf", "3fr", "dcr", "kdc", "mrw", "srf", "x3f", "rwl",
  "jpg", "jpeg", "png", "webp", "tiff", "tif", "heic", "heif",
] as const;

export const ALLOWED_MIME_PREFIXES = [
  "image/raw", "image/x-raw", "image/cr2", "image/x-cr2",
  "image/x-nikon-nef", "image/x-olympus-orf", "image/x-panasonic-rw2",
  "image/adobe-dng", "image/dng",
  "image/jpeg", "image/png", "image/webp", "image/tiff",
  "image/heic", "image/heif",
] as const;

export const SignUploadBodySchema = z.object({
  folderId: z.string().uuid(),
  files: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
        mime: z.string().refine(
          (m) =>
            ALLOWED_MIME_PREFIXES.some((p) => m.startsWith(p)) ||
            m.startsWith("image/"),
          { message: "Unsupported MIME type" }
        ),
      })
    )
    .min(1)
    .max(20),
});

export const CreateFileBodySchema = z.object({
  folderId: z.string().uuid(),
  name: z.string().min(1).max(255),
  ext: z
    .string()
    .min(1)
    .max(16)
    .transform((e) => e.toLowerCase())
    .refine(
      (e): e is (typeof ALLOWED_EXTENSIONS)[number] =>
        (ALLOWED_EXTENSIONS as readonly string[]).includes(e),
      { message: "Extension not in allowlist" }
    ),
  mime: z.string().min(1),
  size_bytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  storage_key_original: z.string().min(1),
});

export const ListFilesQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["name", "updated_at", "size_bytes"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  type: z.string().optional(), // filter by ext or mime prefix
});

export const PatchFileBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  folderId: z.string().uuid().optional(),
});

export const SignedUrlQuerySchema = z.object({
  variant: z.enum(["thumb", "preview", "original"]),
});

export const CreateFolderBodySchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(255),
  path: z.string().optional(),
});

export const PatchFolderBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  parent_id: z.string().uuid().nullable().optional(),
});

export type SignUploadBody = z.infer<typeof SignUploadBodySchema>;
export type CreateFileBody = z.infer<typeof CreateFileBodySchema>;
export type ListFilesQuery = z.infer<typeof ListFilesQuerySchema>;
export type PatchFileBody = z.infer<typeof PatchFileBodySchema>;
export type SignedUrlQuery = z.infer<typeof SignedUrlQuerySchema>;
export type CreateFolderBody = z.infer<typeof CreateFolderBodySchema>;
export type PatchFolderBody = z.infer<typeof PatchFolderBodySchema>;
