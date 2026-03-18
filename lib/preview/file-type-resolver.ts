/**
 * File type resolver — single source of truth for preview strategy.
 * Maps (mimeType, filename, sizeBytes) → PreviewKind.
 * Import PREVIEW_SIZE_CAPS from contracts once Task 1 is done;
 * for now define them inline to avoid circular deps.
 */

export type PreviewKind =
  | "image"
  | "pdf"
  | "raw_embedded"
  | "audio"
  | "video"
  | "google_redirect"
  | "office_fallback"
  | "unsupported";

export type UnsupportedReason =
  | "too_large"
  | "unknown_type"
  | "html_svg_blocked"
  | "split_file";

export type ResolvedPreview =
  | { kind: Exclude<PreviewKind, "unsupported"> }
  | { kind: "unsupported"; reason: UnsupportedReason };

// Size caps in bytes
export const PREVIEW_SIZE_CAPS: Record<string, number> = {
  image: 100 * 1024 * 1024,
  raw_embedded: 100 * 1024 * 1024,
  pdf: 50 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 200 * 1024 * 1024,
};

// RAW file extensions (lowercase, no dot)
const RAW_EXTENSIONS = new Set([
  "arw", "cr2", "cr3", "nef", "nrw", "dng", "raf", "orf", "rw2", "pef",
  "srw", "x3f", "3fr", "mef", "mrw", "rwl", "iiq", "cap", "erf",
]);

// Office extensions (lowercase, no dot)
const OFFICE_EXTENSIONS = new Set([
  "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp",
]);

// Blocked inline types (security risk)
const BLOCKED_MIME_PREFIXES = ["text/html", "image/svg"];

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot === -1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

function classifyKind(mimeType: string | null | undefined, filename: string): PreviewKind {
  const mime = mimeType ?? "";
  const ext = getExtension(filename);

  // Blocked types
  if (BLOCKED_MIME_PREFIXES.some((p) => mime.startsWith(p))) return "unsupported";
  if (ext === "html" || ext === "htm" || ext === "svg") return "unsupported";

  // Google Workspace
  if (mime.startsWith("application/vnd.google-apps.")) return "google_redirect";

  // Images
  if (mime.startsWith("image/")) return "image";
  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff", "tif", "avif", "heic", "heif"].includes(ext)) return "image";

  // RAW (check before generic image)
  if (RAW_EXTENSIONS.has(ext)) return "raw_embedded";

  // PDF
  if (mime === "application/pdf" || ext === "pdf") return "pdf";

  // Audio
  if (mime.startsWith("audio/")) return "audio";
  if (["mp3", "wav", "ogg", "flac", "aac", "m4a", "opus", "weba"].includes(ext)) return "audio";

  // Video
  if (mime.startsWith("video/")) return "video";
  if (["mp4", "webm", "mov", "avi", "mkv", "m4v", "ogv", "3gp"].includes(ext)) return "video";

  // Office
  if (OFFICE_EXTENSIONS.has(ext)) return "office_fallback";
  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) return "office_fallback";

  return "unsupported";
}

/**
 * Resolve the preview strategy for a file.
 * @param mimeType - MIME type from metadata (may be null)
 * @param filename - File name including extension
 * @param sizeBytes - File size in bytes (null = unknown, skip size check)
 * @param isSplit - Whether the file is a split file (always unsupported)
 */
export function resolvePreview(
  mimeType: string | null | undefined,
  filename: string,
  sizeBytes: number | null | undefined,
  isSplit = false,
): ResolvedPreview {
  if (isSplit) return { kind: "unsupported", reason: "split_file" };

  const kind = classifyKind(mimeType, filename);

  if (kind === "unsupported") {
    const ext = getExtension(filename);
    const mime = mimeType ?? "";
    if (BLOCKED_MIME_PREFIXES.some((p) => mime.startsWith(p)) || ext === "html" || ext === "htm" || ext === "svg") {
      return { kind: "unsupported", reason: "html_svg_blocked" };
    }
    return { kind: "unsupported", reason: "unknown_type" };
  }

  // google_redirect and office_fallback skip size checks
  if (kind === "google_redirect" || kind === "office_fallback") {
    return { kind };
  }

  // Size cap check
  const cap = PREVIEW_SIZE_CAPS[kind];
  if (cap !== undefined && sizeBytes != null && sizeBytes > cap) {
    return { kind: "unsupported", reason: "too_large" };
  }

  return { kind };
}

/** Convenience: get just the kind string (ignores size). Useful for icon selection. */
export function classifyFileKind(
  mimeType: string | null | undefined,
  filename: string,
): PreviewKind {
  return classifyKind(mimeType, filename);
}
