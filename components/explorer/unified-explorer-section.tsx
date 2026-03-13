"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  AccountProvider,
  FilePreviewStatus,
  FileSortBy,
  SortOrder,
} from "@/lib/contracts";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { ExplorerControls } from "./explorer-controls";
import { FileList } from "./file-list";
import { FolderTree } from "./folder-tree";
import {
  createFolder,
  deleteFile,
  deleteFolder,
  fetchFileDetail,
  fetchFiles,
  fetchFolders,
  moveFile,
  moveFolder,
  renameFile,
  renameFolder,
  type ExplorerFileItem,
  type ExplorerFolderItem,
} from "./contracts";

type AsyncState = "idle" | "loading" | "error" | "success";
type ProviderFilter = AccountProvider | "all";

const defaultSortBy: FileSortBy = "updatedAt";
const defaultSortOrder: SortOrder = "desc";

export function UnifiedExplorerSection() {
  const [folders, setFolders] = useState<ExplorerFolderItem[]>([]);
  const [files, setFiles] = useState<ExplorerFileItem[]>([]);
  const [foldersState, setFoldersState] = useState<AsyncState>("idle");
  const [filesState, setFilesState] = useState<AsyncState>("idle");
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState<ProviderFilter>("all");
  const [previewStatus, setPreviewStatus] = useState<FilePreviewStatus | "all">("all");
  const [sortBy, setSortBy] = useState<FileSortBy>(defaultSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);
  const filesRequestRef = useRef(0);
  const filesAbortControllerRef = useRef<AbortController | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileDetail, setSelectedFileDetail] = useState<ExplorerFileItem | null>(null);
  const [fileDetailState, setFileDetailState] = useState<AsyncState>("idle");
  const [fileDetailError, setFileDetailError] = useState<string | null>(null);
  const fileDetailRequestRef = useRef(0);
  const fileDetailAbortControllerRef = useRef<AbortController | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearActionError = useCallback(() => setActionError(null), []);

  const loadFolders = useCallback(async (signal?: AbortSignal) => {
    try {
      setFoldersState("loading");
      setFoldersError(null);
      const nextFolders = await fetchFolders(signal);
      setFolders(nextFolders);
      setFoldersState("success");
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      setFoldersState("error");
      setFoldersError(error instanceof Error ? error.message : "Unable to load folders.");
    }
  }, []);

  const loadFiles = useCallback(
    async (signal?: AbortSignal) => {
      const requestId = ++filesRequestRef.current;
      try {
        setFilesState("loading");
        setFilesError(null);
        const nextFiles = await fetchFiles(
          {
            folderId: selectedFolderId ?? undefined,
            search,
            provider: provider === "all" ? undefined : provider,
            previewStatus: previewStatus === "all" ? undefined : previewStatus,
            sortBy,
            sortOrder,
          },
          signal,
        );
        if (signal?.aborted || requestId !== filesRequestRef.current) {
          return;
        }
        setFiles(nextFiles);
        setFilesState("success");
      } catch (error) {
        if (signal?.aborted || requestId !== filesRequestRef.current) {
          return;
        }
        setFilesState("error");
        setFilesError(error instanceof Error ? error.message : "Unable to load files.");
      }
    },
    [previewStatus, provider, search, selectedFolderId, sortBy, sortOrder],
  );

  const requestFiles = useCallback(() => {
    filesAbortControllerRef.current?.abort();
    const controller = new AbortController();
    filesAbortControllerRef.current = controller;
    void loadFiles(controller.signal);
  }, [loadFiles]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadFolders(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadFolders]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestFiles();
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [requestFiles]);

  const selectedFileIdInView = useMemo(() => {
    if (!selectedFileId) {
      return null;
    }
    return files.some((file) => file.id === selectedFileId) ? selectedFileId : null;
  }, [files, selectedFileId]);

  const loadSelectedFileDetail = useCallback(async (fileId: string, signal?: AbortSignal) => {
    const requestId = ++fileDetailRequestRef.current;
    try {
      setFileDetailState("loading");
      setFileDetailError(null);
      const detail = await fetchFileDetail(fileId, signal);
      if (signal?.aborted || requestId !== fileDetailRequestRef.current) {
        return;
      }
      setSelectedFileDetail(detail);
      setFileDetailState("success");
    } catch (error) {
      if (signal?.aborted || requestId !== fileDetailRequestRef.current) {
        return;
      }
      setSelectedFileDetail(null);
      setFileDetailState("error");
      setFileDetailError(error instanceof Error ? error.message : "Unable to load file detail.");
    }
  }, []);

  const requestSelectedFileDetail = useCallback(
    (fileId: string) => {
      fileDetailAbortControllerRef.current?.abort();
      const controller = new AbortController();
      fileDetailAbortControllerRef.current = controller;
      void loadSelectedFileDetail(fileId, controller.signal);
    },
    [loadSelectedFileDetail],
  );

  const handleSelectFile = useCallback(
    (fileId: string) => {
      setSelectedFileId(fileId);
      requestSelectedFileDetail(fileId);
    },
    [requestSelectedFileDetail],
  );

  const runFolderAction = useCallback(
    async (
      key: string,
      fn: () => Promise<unknown>,
    ) => {
      setActionLoading(key);
      setActionError(null);
      try {
        await fn();
        await loadFolders();
        await loadFiles(undefined);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed.");
      } finally {
        setActionLoading(null);
      }
    },
    [loadFolders, loadFiles],
  );

  const runFileAction = useCallback(
    async (
      key: string,
      fn: () => Promise<unknown>,
    ) => {
      setActionLoading(key);
      setActionError(null);
      try {
        await fn();
        await loadFiles(undefined);
        if (selectedFileIdInView) {
          requestSelectedFileDetail(selectedFileIdInView);
        }
      } catch (err) {
        setActionError(err instanceof Error ? err.message : "Action failed.");
      } finally {
        setActionLoading(null);
      }
    },
    [loadFiles, selectedFileIdInView, requestSelectedFileDetail],
  );

  const handleCreateFolder = useCallback(
    async (name: string, parentId: string | null) => {
      await runFolderAction("create", () =>
        createFolder({ name, parentId: parentId ?? undefined }),
      );
    },
    [runFolderAction],
  );

  const handleRenameFolder = useCallback(
    async (folderId: string, name: string) => {
      await runFolderAction(`rename:${folderId}`, () =>
        renameFolder(folderId, { name }),
      );
    },
    [runFolderAction],
  );

  const handleMoveFolder = useCallback(
    async (folderId: string, parentId: string | null) => {
      await runFolderAction(`move:${folderId}`, () =>
        moveFolder(folderId, { parentId }),
      );
    },
    [runFolderAction],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      await runFolderAction(`delete:${folderId}`, () => deleteFolder(folderId));
    },
    [runFolderAction],
  );

  const handleRenameFile = useCallback(
    async (fileId: string, name: string) => {
      await runFileAction(`rename:${fileId}`, () => renameFile(fileId, { name }));
    },
    [runFileAction],
  );

  const handleMoveFile = useCallback(
    async (fileId: string, folderId: string | null) => {
      await runFileAction(`move:${fileId}`, () =>
        moveFile(fileId, { folderId }),
      );
    },
    [runFileAction],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      await runFileAction(`delete:${fileId}`, () => deleteFile(fileId));
    },
    [runFileAction],
  );

  useEffect(() => {
    return () => {
      filesAbortControllerRef.current?.abort();
      fileDetailAbortControllerRef.current?.abort();
    };
  }, []);

  const selectedFolderPath = useMemo(() => {
    if (!selectedFolderId) {
      return "All files";
    }
    const current = folders.find((folder) => folder.id === selectedFolderId);
    return current?.path ?? "Selected folder";
  }, [folders, selectedFolderId]);

  const showFileLoading = filesState === "loading";
  const showFileError = filesState === "error";
  const showEmpty = filesState === "success" && files.length === 0;
  const hasActiveFilters =
    search.trim().length > 0 ||
    provider !== "all" ||
    previewStatus !== "all" ||
    sortBy !== defaultSortBy ||
    sortOrder !== defaultSortOrder;
  const hasLoadedBaseExplorer = filesState === "success" && foldersState === "success";
  const hasAnyExplorerData = folders.length > 0 || files.length > 0;
  const showSeedCheck = hasLoadedBaseExplorer && selectedFolderId === null && !hasActiveFilters;
  const emptyStateMessage = hasActiveFilters
    ? "No files found for current filters."
    : "No files available in explorer.";
  const emptyStateHint = hasActiveFilters
    ? "Seed data may exist. Reset controls or switch folders to verify."
    : folders.length > 0
      ? "Folders are present but no files are seeded yet."
      : "Explorer appears empty and may need seed fixtures.";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unified explorer shell</CardTitle>
        <CardDescription>
          Read-only explorer composed from frozen slice-2 contracts (`/api/folders`, `/api/files`)
          with provider and preview visibility.
        </CardDescription>
      </CardHeader>
      <CardContent className="rv-stack">
        <ExplorerControls
          search={search}
          provider={provider}
          previewStatus={previewStatus}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={setSearch}
          onProviderChange={setProvider}
          onPreviewStatusChange={setPreviewStatus}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          onReset={() => {
            setSearch("");
            setProvider("all");
            setPreviewStatus("all");
            setSortBy(defaultSortBy);
            setSortOrder(defaultSortOrder);
          }}
        />

        {showSeedCheck ? (
          <section className="rv-row" aria-label="Explorer seed visibility">
            <div className="rv-inline">
              <strong>Seed check:</strong>
              <Badge tone={hasAnyExplorerData ? "success" : "muted"}>
                {hasAnyExplorerData ? "Seeded data detected" : "No seeded data detected"}
              </Badge>
            </div>
            <p className="rv-muted">
              {hasAnyExplorerData
                ? `${folders.length} folder${folders.length === 1 ? "" : "s"} and ${files.length} file${
                    files.length === 1 ? "" : "s"
                  } loaded in base explorer view.`
                : "Base explorer view is empty. Run seed flow before verification."}
            </p>
          </section>
        ) : null}

        <div className="rv-inline">
          <strong>Path:</strong>
          <span className="rv-muted">{selectedFolderPath}</span>
          <span className="rv-muted" aria-live="polite">
            {filesState === "success" ? `${files.length} file${files.length === 1 ? "" : "s"}` : ""}
          </span>
          {hasActiveFilters ? <span className="rv-muted">Filters active</span> : null}
        </div>

        {actionError ? (
          <div className="rv-alert" role="alert">
            <p>{actionError}</p>
            <Button variant="link" type="button" onClick={clearActionError} aria-label="Dismiss">
              Dismiss
            </Button>
          </div>
        ) : null}

        {showFileError && filesError ? (
          <div className="rv-alert" role="alert">
            <p>{filesError}</p>
            <Button
              variant="link"
              type="button"
              onClick={async () => {
                requestFiles();
              }}
            >
              Retry files
            </Button>
          </div>
        ) : null}

        <div className="rv-explorer-grid">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
            loading={foldersState === "loading"}
            errorMessage={foldersState === "error" ? foldersError : null}
            onRetry={loadFolders}
            onCreateFolder={handleCreateFolder}
            onRenameFolder={handleRenameFolder}
            onMoveFolder={handleMoveFolder}
            onDeleteFolder={handleDeleteFolder}
            actionLoading={actionLoading}
          />
          <div className="rv-stack">
            {showFileLoading ? (
              <div className="rv-list" aria-busy="true" aria-live="polite">
                <Skeleton height={72} />
                <Skeleton height={72} />
                <Skeleton height={72} />
              </div>
            ) : null}

            {showEmpty ? (
              <div className="rv-empty">
                <p>{emptyStateMessage}</p>
                <p className="rv-muted">{emptyStateHint}</p>
              </div>
            ) : null}

            {!showFileLoading && !showEmpty && !showFileError ? (
              <FileList
                files={files}
                selectedFileId={selectedFileIdInView}
                onSelectFile={handleSelectFile}
                folders={folders}
                onRenameFile={handleRenameFile}
                onMoveFile={handleMoveFile}
                onDeleteFile={handleDeleteFile}
                actionLoading={actionLoading}
              />
            ) : null}

            <section className="rv-row" aria-label="File detail panel">
              <div className="rv-inline">
                <strong>File detail:</strong>
                <Badge tone={selectedFileIdInView ? "success" : "muted"}>
                  {selectedFileIdInView ? "Selected file" : "No file selected"}
                </Badge>
                {selectedFileIdInView ? (
                  <Button
                    variant="link"
                    type="button"
                    onClick={async () => {
                      requestSelectedFileDetail(selectedFileIdInView);
                    }}
                  >
                    Refresh detail
                  </Button>
                ) : null}
              </div>

              {!selectedFileIdInView ? (
                <p className="rv-muted">
                  Select a file from the list to fetch canonical detail from `/api/files/:id`.
                </p>
              ) : null}

              {selectedFileIdInView && fileDetailState === "loading" ? (
                <div className="rv-list" aria-busy="true" aria-live="polite">
                  <Skeleton height={72} />
                </div>
              ) : null}

              {selectedFileIdInView && fileDetailState === "error" && fileDetailError ? (
                <div className="rv-alert" role="alert">
                  <p>{fileDetailError}</p>
                  <Button
                    variant="link"
                    type="button"
                    onClick={async () => {
                      requestSelectedFileDetail(selectedFileIdInView);
                    }}
                  >
                    Retry detail
                  </Button>
                </div>
              ) : null}

              {selectedFileIdInView && fileDetailState === "success" && selectedFileDetail ? (
                <div className="rv-meta">
                  <span>Name: {selectedFileDetail.name}</span>
                  <span>File ID: {selectedFileDetail.id}</span>
                  <span>Folder ID: {selectedFileDetail.folderId ?? "root"}</span>
                  <span>Provider account ID: {selectedFileDetail.storageAccountId ?? "n/a"}</span>
                  <span>MIME: {selectedFileDetail.mime ?? "n/a"}</span>
                  <span>Extension: {selectedFileDetail.ext ?? "n/a"}</span>
                  <span>Size: {selectedFileDetail.sizeBytes} bytes</span>
                  <span>Preview status: {selectedFileDetail.previewStatus}</span>
                  <span>Sync status: {selectedFileDetail.syncStatus}</span>
                  <span>Preview error code: {selectedFileDetail.errorCode ?? "none"}</span>
                  <span>Updated: {new Date(selectedFileDetail.updatedAt).toLocaleString()}</span>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
