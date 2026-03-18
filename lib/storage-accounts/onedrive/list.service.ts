/**
 * List files and folders from Microsoft OneDrive/Graph API.
 */

import { ApiError } from "@/lib/api/errors";
import type { DriveBrowseItem } from "@/lib/contracts";

export type OneDriveListInput = {
  accessToken: string;
  folderId: string | null;
};

function extractGraphError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (typeof r.message === "string") return r.message;
  return null;
}

function toBrowseItem(
  item: {
    id?: string;
    name?: string;
    size?: number;
    file?: { mimeType?: string };
    folder?: Record<string, unknown>;
    thumbnails?: Array<{
      medium?: { url?: string };
      small?: { url?: string };
      large?: { url?: string };
    }>;
  },
): DriveBrowseItem {
  const isFolder = "folder" in item && item.folder != null;
  const thumb = item.thumbnails?.[0];
  return {
    id: item.id ?? "",
    name: item.name ?? "Untitled",
    isFolder,
    mimeType: item.file?.mimeType ?? null,
    sizeBytes: item.size ?? null,
    thumbnailLink: thumb?.medium?.url ?? thumb?.small?.url ?? thumb?.large?.url,
  };
}

export async function listOneDrive(
  input: OneDriveListInput,
): Promise<{ folders: DriveBrowseItem[]; files: DriveBrowseItem[] }> {
  // folderId=null, empty, or "root" → root; otherwise list children of that folder
  const effectiveFolderId =
    input.folderId && input.folderId.trim().length > 0 && input.folderId.trim() !== "root"
      ? input.folderId.trim()
      : null;
  const base = effectiveFolderId
    ? `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(effectiveFolderId)}`
    : "https://graph.microsoft.com/v1.0/me/drive/root";

  const url = `${base}/children?$top=100&$orderby=name&$select=id,name,size,file,folder&$expand=thumbnails($select=small,medium,large)`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = extractGraphError(payload) ?? "OneDrive list failed";
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

  const items = (payload?.value ?? []) as Array<{
    id?: string;
    name?: string;
    size?: number;
    file?: { mimeType?: string };
    folder?: Record<string, unknown>;
    thumbnails?: Array<{
      medium?: { url?: string };
      small?: { url?: string };
      large?: { url?: string };
    }>;
  }>;

  const folders: DriveBrowseItem[] = [];
  const fileItems: DriveBrowseItem[] = [];

  for (const item of items) {
    const browse = toBrowseItem(item);
    if (browse.isFolder) {
      folders.push(browse);
    } else {
      fileItems.push(browse);
    }
  }

  return { folders, files: fileItems };
}
