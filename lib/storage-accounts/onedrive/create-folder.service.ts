/**
 * Create a folder on OneDrive (Microsoft Graph API).
 */

import { ApiError } from "@/lib/api/errors";

export type OneDriveCreateFolderInput = {
  accessToken: string;
  parentFolderId: string | null;
  name: string;
};

export type OneDriveCreateFolderResult = {
  providerFolderId: string;
};

function extractGraphError(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const r = payload as Record<string, unknown>;
  const err = r.error as Record<string, unknown> | undefined;
  if (err && typeof err.message === "string") return err.message;
  if (typeof r.message === "string") return r.message;
  return null;
}

export async function createFolderOnOneDrive(
  input: OneDriveCreateFolderInput,
): Promise<OneDriveCreateFolderResult> {
  const parentId =
    input.parentFolderId &&
    input.parentFolderId.trim().length > 0 &&
    input.parentFolderId.trim() !== "root"
      ? input.parentFolderId.trim()
      : null;

  const url = parentId
    ? `https://graph.microsoft.com/v1.0/me/drive/items/${encodeURIComponent(parentId)}/children`
    : "https://graph.microsoft.com/v1.0/me/drive/root/children";

  const body = {
    name: input.name.trim() || "New folder",
    folder: {},
    "@microsoft.graph.conflictBehavior": "rename",
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const msg = extractGraphError(payload) ?? "OneDrive create folder failed";
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

  const record = (payload ?? {}) as Record<string, unknown>;
  const id = typeof record.id === "string" ? record.id : null;
  if (!id) {
    throw new ApiError(
      502,
      "PROVIDER_ACCESS_FAILED",
      "OneDrive did not return a folder id.",
      { provider: "onedrive" },
    );
  }

  return { providerFolderId: id };
}
