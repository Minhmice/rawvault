/**
 * Create a folder on Google Drive (API v3).
 */

import { ApiError } from "@/lib/api/errors";

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

export type GDriveCreateFolderInput = {
  accessToken: string;
  parentFolderId: string | null;
  name: string;
};

export type GDriveCreateFolderResult = {
  providerFolderId: string;
};

const DRIVE_ID_REGEX = /^[\w-]+$/;

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

export async function createFolderOnGoogleDrive(
  input: GDriveCreateFolderInput,
): Promise<GDriveCreateFolderResult> {
  const parentId =
    input.parentFolderId &&
    input.parentFolderId.trim().length > 0 &&
    DRIVE_ID_REGEX.test(input.parentFolderId.trim())
      ? input.parentFolderId.trim()
      : "root";

  const body = {
    name: input.name.trim() || "New folder",
    mimeType: DRIVE_FOLDER_MIME,
    parents: [parentId],
  };

  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = extractDriveError(payload) ?? "Google Drive create folder failed";
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

  const record = (payload ?? {}) as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  if (!id) {
    throw new ApiError(
      502,
      "PROVIDER_ACCESS_FAILED",
      "Google Drive did not return a folder id.",
      { provider: "gdrive" },
    );
  }

  return { providerFolderId: id };
}
