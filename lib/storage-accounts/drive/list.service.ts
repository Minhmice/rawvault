/**
 * List files and folders from Google Drive API v3.
 */

import { ApiError } from "@/lib/api/errors";
import type { DriveBrowseItem } from "@/lib/contracts";

const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";

export type GDriveListInput = {
  accessToken: string;
  folderId: string | null;
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

function toBrowseItem(
  f: { id?: string; name?: string; mimeType?: string; size?: string; webViewLink?: string; thumbnailLink?: string },
): DriveBrowseItem {
  const isFolder = f.mimeType === DRIVE_FOLDER_MIME;
  const sizeBytes = f.size ? parseInt(f.size, 10) : null;
  return {
    id: (f.id && f.id.trim().length > 0) ? f.id.trim() : "",
    name: f.name ?? "Untitled",
    isFolder,
    mimeType: f.mimeType ?? null,
    sizeBytes: Number.isNaN(sizeBytes ?? NaN) ? null : sizeBytes,
    webViewLink: f.webViewLink,
    thumbnailLink: f.thumbnailLink,
  };
}

const PAGE_SIZE = 200;
type DriveFileRow = { id?: string; name?: string; mimeType?: string; size?: string; webViewLink?: string; thumbnailLink?: string };

/** Drive file/folder IDs are alphanumeric with - and _; reject anything else to avoid query injection. */
const DRIVE_ID_REGEX = /^[\w-]+$/;

export async function listGoogleDrive(
  input: GDriveListInput,
): Promise<{ folders: DriveBrowseItem[]; files: DriveBrowseItem[] }> {
  const rawFolderId =
    input.folderId && input.folderId.trim().length > 0 ? input.folderId.trim() : null;
  const effectiveFolderId =
    rawFolderId && DRIVE_ID_REGEX.test(rawFolderId) ? rawFolderId : null;
  if (rawFolderId && !effectiveFolderId) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "folderId contains invalid characters for Google Drive.",
      { provider: "gdrive" },
    );
  }
  const parentQuery = effectiveFolderId
    ? `'${effectiveFolderId}' in parents`
    : "'root' in parents";
  const q = `${parentQuery} and trashed=false`;

  const allFiles: DriveFileRow[] = [];
  let pageToken: string | null = null;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", q);
    url.searchParams.set("pageSize", String(PAGE_SIZE));
    url.searchParams.set("fields", "nextPageToken,files(id,name,mimeType,size,webViewLink,thumbnailLink)");
    url.searchParams.set("orderBy", "folder,name");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = extractDriveError(payload) ?? "Google Drive list failed";
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

    const page = (payload?.files ?? []) as DriveFileRow[];
    allFiles.push(...page);
    pageToken = (payload?.nextPageToken as string) ?? null;
  } while (pageToken);

  const folders: DriveBrowseItem[] = [];
  const fileItems: DriveBrowseItem[] = [];

  for (const f of allFiles) {
    if (!f.id || f.id.trim().length < 1) continue;
    const item = toBrowseItem(f);
    if (item.isFolder) {
      folders.push(item);
    } else {
      fileItems.push(item);
    }
  }

  return { folders, files: fileItems };
}
