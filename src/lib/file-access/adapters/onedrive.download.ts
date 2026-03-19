/**
 * Phase 9: OneDrive download adapter.
 * Fetches file content via Microsoft Graph /content endpoint.
 * Graph returns 302 redirect; we follow and proxy the bytes.
 */

import { ApiError } from "@/lib/api/errors";

export type OneDriveDownloadInput = {
  accessToken: string;
  providerFileId: string;
};

export type OneDriveDownloadResult = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number | null;
};

function extractGraphError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (typeof r.message === "string") return r.message;
  return null;
}

export async function downloadFromOneDrive(
  input: OneDriveDownloadInput,
): Promise<OneDriveDownloadResult> {
  const url = `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(input.providerFileId)}/content`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
    redirect: "follow",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const msg = extractGraphError(payload) ?? "OneDrive download failed";
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
      { provider: "onedrive" },
    );
  }

  const body = response.body;
  if (!body) {
    throw new ApiError(
      502,
      "PROVIDER_ACCESS_FAILED",
      "OneDrive did not return a response body.",
      { provider: "onedrive" },
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "application/octet-stream";
  const contentLength = response.headers.get("content-length");
  const contentLengthNum = contentLength ? parseInt(contentLength, 10) : null;

  return {
    body,
    contentType,
    contentLength: Number.isNaN(contentLengthNum ?? NaN) ? null : contentLengthNum,
  };
}
