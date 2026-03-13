"use client";

import { useCallback, useRef, useState } from "react";
import { Badge } from "../ui/badge";
import { ProviderBadge } from "../account-management/provider-badge";
import { Button } from "../ui/button";
import type { ExplorerFileItem, ExplorerFolderItem } from "./contracts";

type FileListProps = {
  files: ExplorerFileItem[];
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  folders?: ExplorerFolderItem[];
  onRenameFile?: (fileId: string, name: string) => Promise<void>;
  onMoveFile?: (fileId: string, folderId: string | null) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  actionLoading?: string | null;
  actionError?: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  const decimals = value >= 10 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

function previewTone(status: ExplorerFileItem["previewStatus"]) {
  if (status === "ready") {
    return "success";
  }
  if (status === "failed") {
    return "default";
  }
  return "muted";
}

function previewLabel(status: ExplorerFileItem["previewStatus"]) {
  if (status === "ready") {
    return "Preview ready";
  }
  if (status === "failed") {
    return "Preview failed";
  }
  if (status === "processing") {
    return "Preview processing";
  }
  return "Preview pending";
}

function flattenFoldersForMove(folders: ExplorerFolderItem[]): { id: string; path: string }[] {
  return folders.map((f) => ({ id: f.id, path: f.path })).sort((a, b) => a.path.localeCompare(b.path));
}

type FileRowProps = {
  file: ExplorerFileItem;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  renamingFileId: string | null;
  movingFileId: string | null;
  moveTargets: { id: string; path: string }[];
  onRenameFile?: (fileId: string, name: string) => Promise<void>;
  onMoveFile?: (fileId: string, folderId: string | null) => Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<void>;
  onStartRename: (fileId: string) => void;
  onStartMove: (fileId: string) => void;
  onCancelEdit: () => void;
  actionLoading: string | null;
};

function FileRow({
  file,
  selectedFileId,
  onSelectFile,
  renamingFileId,
  movingFileId,
  moveTargets,
  onRenameFile,
  onMoveFile,
  onDeleteFile,
  onStartRename,
  onStartMove,
  onCancelEdit,
  actionLoading,
}: FileRowProps) {
  const [editName, setEditName] = useState(file.name);
  const [moveFolderId, setMoveFolderId] = useState<string | null>(file.folderId);
  const inputRef = useRef<HTMLInputElement>(null);
  const isRenaming = renamingFileId === file.id;
  const isMoving = movingFileId === file.id;

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = editName.trim();
    if (trimmed && onRenameFile && trimmed !== file.name) {
      await onRenameFile(file.id, trimmed);
      onCancelEdit();
    } else {
      onCancelEdit();
    }
  }, [editName, file.id, file.name, onRenameFile, onCancelEdit]);

  const handleMoveSubmit = useCallback(async () => {
    if (onMoveFile && moveFolderId !== file.folderId) {
      await onMoveFile(file.id, moveFolderId);
      onCancelEdit();
    } else {
      onCancelEdit();
    }
  }, [moveFolderId, file.id, file.folderId, onMoveFile, onCancelEdit]);

  const handleDelete = useCallback(async () => {
    if (onDeleteFile && window.confirm(`Delete file "${file.name}"?`)) {
      await onDeleteFile(file.id);
    }
  }, [file.id, file.name, onDeleteFile]);

  if (isRenaming) {
    return (
      <article className="rv-row rv-row-edit">
        <div className="rv-row-top">
          <input
            ref={inputRef}
            type="text"
            className="rv-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRenameSubmit();
              if (e.key === "Escape") onCancelEdit();
            }}
            onBlur={() => void handleRenameSubmit()}
            autoFocus
            aria-label="File name"
          />
          <Button type="button" variant="link" onClick={onCancelEdit} aria-label="Cancel rename">
            Cancel
          </Button>
        </div>
      </article>
    );
  }

  if (isMoving) {
    return (
      <article className="rv-row rv-row-edit">
        <div className="rv-row-top">
          <span className="rv-muted">{file.name}</span>
          <select
            className="rv-select"
            value={moveFolderId ?? ""}
            onChange={(e) => setMoveFolderId(e.target.value || null)}
            aria-label="Move to folder"
          >
            <option value="">Root</option>
            {moveTargets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.path}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="secondary"
            disabled={actionLoading === file.id || actionLoading?.endsWith(`:${file.id}`)}
            onClick={() => void handleMoveSubmit()}
            aria-label="Confirm move"
          >
            Move
          </Button>
          <Button type="button" variant="link" onClick={onCancelEdit} aria-label="Cancel move">
            Cancel
          </Button>
        </div>
      </article>
    );
  }

  const loading = actionLoading === file.id || actionLoading?.endsWith(`:${file.id}`);

  return (
    <article className="rv-row">
      <div className="rv-row-top">
        <div className="rv-stack" style={{ gap: "0.35rem" }}>
          <div className="rv-inline">
            <strong>{file.name}</strong>
            <ProviderBadge provider={file.storageProvider} />
            <Badge tone={previewTone(file.previewStatus)}>{previewLabel(file.previewStatus)}</Badge>
            {loading ? <span aria-live="polite"> …</span> : null}
          </div>
          <div className="rv-meta">
            <span>Size: {formatBytes(file.sizeBytes)}</span>
            <span>Updated: {new Date(file.updatedAt).toLocaleString()}</span>
            <span>Sync: {file.syncStatus}</span>
          </div>
        </div>
        <div className="rv-actions">
          <Button
            type="button"
            variant={selectedFileId === file.id ? "default" : "secondary"}
            aria-pressed={selectedFileId === file.id}
            onClick={() => onSelectFile(file.id)}
            disabled={loading}
          >
            {selectedFileId === file.id ? "Selected" : "View details"}
          </Button>
          {onRenameFile ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                setEditName(file.name);
                onStartRename(file.id);
              }}
              aria-label={`Rename ${file.name}`}
            >
              Rename
            </Button>
          ) : null}
          {onMoveFile && moveTargets.length > 0 ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                setMoveFolderId(file.folderId);
                onStartMove(file.id);
              }}
              aria-label={`Move ${file.name}`}
            >
              Move
            </Button>
          ) : null}
          {onDeleteFile ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete();
              }}
              className="rv-text-destructive"
              aria-label={`Delete ${file.name}`}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FileList({
  files,
  selectedFileId,
  onSelectFile,
  folders = [],
  onRenameFile,
  onMoveFile,
  onDeleteFile,
  actionLoading = null,
  actionError = null,
}: FileListProps) {
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [movingFileId, setMovingFileId] = useState<string | null>(null);
  const moveTargets = flattenFoldersForMove(folders);

  const handleCancelEdit = useCallback(() => {
    setRenamingFileId(null);
    setMovingFileId(null);
  }, []);

  return (
    <section className="rv-list" aria-label="Unified file list">
      {actionError ? (
        <div className="rv-alert" role="alert">
          <p>{actionError}</p>
        </div>
      ) : null}
      {files.map((file) => (
        <FileRow
          key={file.id}
          file={file}
          selectedFileId={selectedFileId}
          onSelectFile={onSelectFile}
          renamingFileId={renamingFileId}
          movingFileId={movingFileId}
          moveTargets={moveTargets}
          onRenameFile={onRenameFile}
          onMoveFile={onMoveFile}
          onDeleteFile={onDeleteFile}
          onStartRename={setRenamingFileId}
          onStartMove={setMovingFileId}
          onCancelEdit={handleCancelEdit}
          actionLoading={actionLoading}
        />
      ))}
    </section>
  );
}
