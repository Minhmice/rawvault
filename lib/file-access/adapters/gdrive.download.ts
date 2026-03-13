/**
 * Phase 9: Google Drive download adapter.
 * Fetches file content via Drive API v3 alt=media.
 */

import { ApiError } from "@/lib/api/errors";

export type GDriveDownloadInput = {
  accessToken: string;
  providerFileId: string;
};

export type GDriveDownloadResult = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number | null;
};

function extractDriveError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error;
  if (
    err &&
    typeof err === "object" &&
    typeof (err as Record<string, unknown>).message === "string"
  ) {
    return (err as Record<string, string>).message;
  }
  if (typeof r.message === "string") return r.message;
  return null;
}

export async function downloadFromGoogleDrive(
  input: GDriveDownloadInput,
): Promise<GDriveDownloadResult> {
  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.providerFileId)}`,
  );
  url.searchParams.set("alt", "media");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const msg = extractDriveError(payload) ?? "Google Drive download failed";
    const status = response.status;
    const code =
      status === 401 || status === 403
        ? "OAUTH_TOKEN_INVALID"
        : status === 404
          ? "PROVIDER_RESOURCE_NOT_FOUND"
          : "PROVIDER_ACCESS_FAILED";
    throw new ApiError(
      status >= 400 && status < 500 ? 400 : 502,
      code,
      msg,
      { provider: "gdrive" },
    );
  }

  const body = response.body;
  if (!body) {
    throw new ApiError(
      502,
      "PROVIDER_ACCESS_FAILED",
      "Google Drive did not return a response body.",
      { provider: "gdrive" },
    );
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = response.headers.get("content-length");
  const contentLengthNum = contentLength ? parseInt(contentLength, 10) : null;

  return {
    body,
    contentType,
    contentLength: Number.isNaN(contentLengthNum ?? NaN) ? null : contentLengthNum,
  };
}
