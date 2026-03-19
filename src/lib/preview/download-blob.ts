/**
 * Download-to-blob utility for file preview.
 * Fetches a URL and returns a Blob with progress reporting and abort support.
 * 
 * Usage:
 *   const controller = new AbortController();
 *   const result = await downloadToBlob(url, {
 *     signal: controller.signal,
 *     onProgress: (loaded, total) => setProgress(total ? loaded / total : null),
 *   });
 *   if (result.ok) {
 *     const objectUrl = URL.createObjectURL(result.blob);
 *     // ... use objectUrl ...
 *     URL.revokeObjectURL(objectUrl); // MUST call on cleanup
 *   }
 */

export type DownloadProgress = {
  loaded: number;
  total: number | null; // null when Content-Length is unknown
  fraction: number | null; // 0–1 or null when unknown
};

export type DownloadResult =
  | { ok: true; blob: Blob; contentType: string }
  | { ok: false; reason: "aborted" | "network_error" | "http_error"; status?: number; message?: string };

export type DownloadOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
};

/**
 * Download a URL to a Blob with progress and abort support.
 * Callers MUST call URL.revokeObjectURL() when done with the blob URL.
 */
export async function downloadToBlob(
  url: string,
  options: DownloadOptions = {},
): Promise<DownloadResult> {
  const { signal, onProgress } = options;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      return {
        ok: false,
        reason: "http_error",
        status: response.status,
        message: `HTTP ${response.status} ${response.statusText}`,
      };
    }

    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const contentLength = response.headers.get("content-length");
    const total = contentLength ? parseInt(contentLength, 10) : null;

    // If no progress callback needed, use simple blob()
    if (!onProgress) {
      const blob = await response.blob();
      return { ok: true, blob, contentType };
    }

    // Stream with progress
    const reader = response.body?.getReader();
    if (!reader) {
      const blob = await response.blob();
      return { ok: true, blob, contentType };
    }

    const chunks: BlobPart[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      onProgress({
        loaded,
        total,
        fraction: total ? loaded / total : null,
      });
    }

    const blob = new Blob(chunks, { type: contentType });
    return { ok: true, blob, contentType };
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        return { ok: false, reason: "aborted" };
      }
      return { ok: false, reason: "network_error", message: err.message };
    }
    return { ok: false, reason: "network_error", message: "Unknown error" };
  }
}

/**
 * Build the stream URL for an app-tracked file.
 * Uses the server-side stream route which handles auth via cookie.
 */
export function buildStreamUrl(fileId: string): string {
  return `/api/files/${encodeURIComponent(fileId)}/stream`;
}

/**
 * Build the download URL for an app-tracked file.
 */
export function buildDownloadUrl(fileId: string): string {
  return `/api/files/${encodeURIComponent(fileId)}/download`;
}
