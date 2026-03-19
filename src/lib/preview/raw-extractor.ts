/**
 * RAW file embedded JPEG preview extractor.
 * Uses exifr to extract the embedded JPEG thumbnail from RAW files.
 * Returns a Blob (JPEG) or null if no embedded preview is available.
 *
 * Supported formats: ARW, CR2, CR3, NEF, NRW, DNG, RAF, ORF, RW2, PEF, etc.
 * Strategy: embedded JPEG preview only — no full RAW demosaic.
 */

// Dynamic import to avoid SSR issues (exifr is browser-only)
async function getExifr() {
  const exifr = await import("exifr");
  return exifr;
}

export type RawExtractionResult =
  | { success: true; blob: Blob; width?: number; height?: number }
  | { success: false; reason: "no_preview" | "extraction_failed" | "timeout" };

const EXTRACTION_TIMEOUT_MS = 10_000;

/**
 * Extract embedded JPEG preview from a RAW file.
 * @param buffer - ArrayBuffer of the RAW file
 * @returns RawExtractionResult
 */
export async function extractRawPreview(
  buffer: ArrayBuffer,
): Promise<RawExtractionResult> {
  const timeoutPromise = new Promise<RawExtractionResult>((resolve) =>
    setTimeout(
      () => resolve({ success: false, reason: "timeout" as const }),
      EXTRACTION_TIMEOUT_MS,
    ),
  );

  const extractionPromise = (async (): Promise<RawExtractionResult> => {
    try {
      const exifr = await getExifr();

      // exifr.thumbnail() returns a Uint8Array of the JPEG bytes
      const thumbnailBytes = await exifr.thumbnail(buffer);

      if (!thumbnailBytes || thumbnailBytes.length === 0) {
        return { success: false, reason: "no_preview" };
      }

      // new Uint8Array(length) yields Uint8Array<ArrayBuffer>, required for Blob compat
      const safeArray = new Uint8Array(thumbnailBytes.byteLength);
      safeArray.set(thumbnailBytes);
      const blob = new Blob([safeArray], { type: "image/jpeg" });
      return { success: true, blob };
    } catch {
      return { success: false, reason: "extraction_failed" };
    }
  })();

  return Promise.race([extractionPromise, timeoutPromise]);
}

export const RAW_EXTENSIONS = new Set([
  "arw", "cr2", "cr3", "nef", "nrw", "dng", "raf", "orf", "rw2", "pef",
  "srw", "x3f", "3fr", "mef", "mrw", "rwl", "iiq", "cap", "erf",
]);

export function isRawExtension(ext: string): boolean {
  return RAW_EXTENSIONS.has(ext.toLowerCase().replace(/^\./, ""));
}
