/**
 * Phase 9: Google Drive download adapter.
 * Fetches file content via Drive API v3:
 * - files.get with alt=media for binary files
 * - files.export for Google Docs/Sheets/Slides (application/vnd.google-apps.*)
 */

import { ApiError } from "@/lib/api/errors";

export type GDriveDownloadInput = {
  accessToken: string;
  providerFileId: string;
  /** If set and is a Google Workspace mime, uses files.export instead of files.get */
  mimeType?: string | null;
};

export type GDriveDownloadResult = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: number | null;
};

const GOOGLE_APPS_DOCUMENT = "application/vnd.google-apps.document";
const GOOGLE_APPS_SPREADSHEET = "application/vnd.google-apps.spreadsheet";
const GOOGLE_APPS_PRESENTATION = "application/vnd.google-apps.presentation";
const GOOGLE_APPS_DRAWING = "application/vnd.google-apps.drawing";
const GOOGLE_APPS_FORM = "application/vnd.google-apps.form";

const GOOGLE_APPS_MIMES = new Set([
  GOOGLE_APPS_DOCUMENT,
  GOOGLE_APPS_SPREADSHEET,
  GOOGLE_APPS_PRESENTATION,
  GOOGLE_APPS_DRAWING,
  GOOGLE_APPS_FORM,
]);

/** Export MIME types for Google Workspace files (drive.readonly allows files.export) */
const EXPORT_MIME_MAP: Record<string, string> = {
  [GOOGLE_APPS_DOCUMENT]: "application/pdf",
  [GOOGLE_APPS_SPREADSHEET]: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  [GOOGLE_APPS_PRESENTATION]: "application/pdf",
  [GOOGLE_APPS_DRAWING]: "image/png",
  [GOOGLE_APPS_FORM]: "application/pdf",
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

function isGoogleWorkspaceFile(mimeType: string | null | undefined): boolean {
  return !!mimeType && GOOGLE_APPS_MIMES.has(mimeType);
}

export async function downloadFromGoogleDrive(
  input: GDriveDownloadInput,
): Promise<GDriveDownloadResult> {
  const useExport =
    isGoogleWorkspaceFile(input.mimeType) &&
    EXPORT_MIME_MAP[input.mimeType!];

  const baseUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(input.providerFileId)}`;
  const url = useExport
    ? new URL(`${baseUrl}/export`)
    : new URL(baseUrl);

  if (useExport) {
    url.searchParams.set("mimeType", EXPORT_MIME_MAP[input.mimeType!]);
  } else {
    url.searchParams.set("alt", "media");
  }

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
