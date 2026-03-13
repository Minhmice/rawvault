"use client";

import {
  type CreateFolderRequest,
  type ExplorerFile,
  type ExplorerFolder,
  createFolderResponseSchema,
  deleteSuccessResponseSchema,
  fileMutationResponseSchema,
  folderMutationResponseSchema,
  getFileResponseSchema,
  listFilesResponseSchema,
  listFoldersResponseSchema,
  type AccountProvider,
  type ExplorerFileItem,
  type ExplorerFolderItem,
  type FilePreviewStatus,
  type FileSortBy,
  type ListFilesQuery,
  type MoveFileRequest,
  type MoveFolderRequest,
  type RenameFileRequest,
  type RenameFolderRequest,
  restoreFileResponseSchema,
  restoreFolderResponseSchema,
  type SortOrder,
  type UploadDispatchRequest,
  type UploadDispatchResponse,
  type UploadExecuteSuccessResponse,
  uploadDispatchResponseSchema,
  uploadExecuteSuccessResponseSchema,
} from "@/lib/contracts";

type ExplorerQueryInput = {
  folderId?: string;
  search?: string;
  provider?: AccountProvider;
  previewStatus?: FilePreviewStatus;
  sortBy: FileSortBy;
  sortOrder: SortOrder;
};

function parseApiError(payload: unknown): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object" &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return "Request failed.";
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  const text = await response.text();
  return text || null;
}

function toFolderItem(folder: ExplorerFolder): ExplorerFolderItem {
  return {
    kind: "folder",
    id: folder.id,
    parentId: folder.parentId,
    name: folder.name,
    path: folder.path,
    isFavorite: false,
    isPinned: false,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

function toFileItem(file: ExplorerFile): ExplorerFileItem {
  return {
    kind: "file",
    id: file.id,
    folderId: file.folderId,
    name: file.name,
    ext: file.ext,
    mime: file.mime,
    sizeBytes: file.sizeBytes,
    storageProvider: file.provider,
    storageAccountId: file.storageAccountId,
    previewStatus: file.previewStatus,
    syncStatus: file.syncStatus,
    errorCode: file.errorCode,
    isFavorite: false,
    isPinned: false,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

export async function fetchFolders(signal?: AbortSignal): Promise<ExplorerFolderItem[]> {
  const response = await fetch("/api/folders", {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return listFoldersResponseSchema.parse(payload).folders.map(toFolderItem);
}

function toQueryString(query: ExplorerQueryInput): string {
  const params = new URLSearchParams();
  if (query.folderId) {
    params.set("folderId", query.folderId);
  }
  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }
  if (query.provider) {
    params.set("provider", query.provider);
  }
  if (query.previewStatus) {
    params.set("previewStatus", query.previewStatus);
  }
  params.set("sortBy", query.sortBy);
  params.set("sortOrder", query.sortOrder);
  const encoded = params.toString();
  return encoded.length > 0 ? `?${encoded}` : "";
}

export async function fetchFiles(
  query: ExplorerQueryInput,
  signal?: AbortSignal,
): Promise<ExplorerFileItem[]> {
  const response = await fetch(`/api/files${toQueryString(query)}`, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return listFilesResponseSchema.parse(payload).files.map(toFileItem);
}

export async function fetchFileDetail(
  fileId: string,
  signal?: AbortSignal,
): Promise<ExplorerFileItem> {
  const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return toFileItem(getFileResponseSchema.parse(payload).file);
}

export async function dispatchUploadPreview(
  request: UploadDispatchRequest,
): Promise<UploadDispatchResponse> {
  const response = await fetch("/api/uploads/dispatch", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return uploadDispatchResponseSchema.parse(payload);
}

export async function executeUpload(
  formData: FormData,
): Promise<UploadExecuteSuccessResponse> {
  const response = await fetch("/api/uploads/execute", {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }

  return uploadExecuteSuccessResponseSchema.parse(payload);
}

// Phase 7 — Folder metadata mutations
export async function createFolder(
  request: CreateFolderRequest,
  signal?: AbortSignal,
): Promise<ExplorerFolderItem> {
  const response = await fetch("/api/folders", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = createFolderResponseSchema.parse(payload);
  return toFolderItem(parsed.folder);
}

export async function renameFolder(
  folderId: string,
  request: RenameFolderRequest,
  signal?: AbortSignal,
): Promise<ExplorerFolderItem> {
  const response = await fetch(`/api/folders/${encodeURIComponent(folderId)}`, {
    method: "PATCH",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = folderMutationResponseSchema.parse(payload);
  return toFolderItem(parsed.folder);
}

export async function moveFolder(
  folderId: string,
  request: MoveFolderRequest,
  signal?: AbortSignal,
): Promise<ExplorerFolderItem> {
  const response = await fetch(`/api/folders/${encodeURIComponent(folderId)}`, {
    method: "PATCH",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = folderMutationResponseSchema.parse(payload);
  return toFolderItem(parsed.folder);
}

export async function deleteFolder(
  folderId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/folders/${encodeURIComponent(folderId)}`, {
    method: "DELETE",
    signal,
    headers: { Accept: "application/json" },
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  deleteSuccessResponseSchema.parse(payload);
}

export async function restoreFolder(
  folderId: string,
  signal?: AbortSignal,
): Promise<ExplorerFolderItem> {
  const response = await fetch(
    `/api/folders/${encodeURIComponent(folderId)}/restore`,
    {
      method: "POST",
      signal,
      headers: { Accept: "application/json" },
    },
  );
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = restoreFolderResponseSchema.parse(payload);
  return toFolderItem(parsed.folder);
}

// Phase 7 — File metadata mutations
export async function renameFile(
  fileId: string,
  request: RenameFileRequest,
  signal?: AbortSignal,
): Promise<ExplorerFileItem> {
  const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = fileMutationResponseSchema.parse(payload);
  return toFileItem(parsed.file);
}

export async function moveFile(
  fileId: string,
  request: MoveFileRequest,
  signal?: AbortSignal,
): Promise<ExplorerFileItem> {
  const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: "PATCH",
    signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(request),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = fileMutationResponseSchema.parse(payload);
  return toFileItem(parsed.file);
}

export async function deleteFile(
  fileId: string,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`/api/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    signal,
    headers: { Accept: "application/json" },
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  deleteSuccessResponseSchema.parse(payload);
}

export async function restoreFile(
  fileId: string,
  signal?: AbortSignal,
): Promise<ExplorerFileItem> {
  const response = await fetch(
    `/api/files/${encodeURIComponent(fileId)}/restore`,
    {
      method: "POST",
      signal,
      headers: { Accept: "application/json" },
    },
  );
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new Error(parseApiError(payload));
  }
  const parsed = restoreFileResponseSchema.parse(payload);
  return toFileItem(parsed.file);
}

export type ExplorerQuery = ListFilesQuery;
export type {
  ExplorerFileItem,
  ExplorerFolderItem,
  UploadDispatchRequest,
  UploadDispatchResponse,
  UploadExecuteSuccessResponse,
};
