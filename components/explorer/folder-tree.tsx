"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import type { ExplorerFolderItem } from "./contracts";

type FolderTreeProps = {
  folders: ExplorerFolderItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  loading: boolean;
  errorMessage: string | null;
  onRetry: () => Promise<void>;
  onCreateFolder?: (name: string, parentId: string | null) => Promise<void>;
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentId: string | null) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  actionLoading?: string | null;
  actionError?: string | null;
};

type FolderNode = ExplorerFolderItem & {
  children: FolderNode[];
};

function getSelfAndDescendantIds(nodes: FolderNode[], folderId: string): Set<string> {
  const ids = new Set<string>();
  const collect = (n: FolderNode) => {
    ids.add(n.id);
    for (const c of n.children) collect(c);
  };
  const find = (n: FolderNode): FolderNode | null => {
    if (n.id === folderId) return n;
    for (const c of n.children) {
      const found = find(c);
      if (found) return found;
    }
    return null;
  };
  for (const root of nodes) {
    const target = find(root);
    if (target) {
      collect(target);
      break;
    }
  }
  return ids;
}

function flattenFolders(nodes: FolderNode[]): { id: string; name: string; path: string }[] {
  const out: { id: string; name: string; path: string }[] = [];
  const visit = (n: FolderNode) => {
    out.push({ id: n.id, name: n.name, path: n.path });
    for (const c of n.children) visit(c);
  };
  for (const root of nodes) visit(root);
  return out;
}

function buildTree(folders: ExplorerFolderItem[]): FolderNode[] {
  const nodeMap = new Map<string, FolderNode>();
  for (const folder of folders) {
    nodeMap.set(folder.id, { ...folder, children: [] });
  }

  const roots: FolderNode[] = [];
  for (const node of nodeMap.values()) {
    if (!node.parentId) {
      roots.push(node);
      continue;
    }
    const parent = nodeMap.get(node.parentId);
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  const sortNodes = (nodes: FolderNode[]) => {
    nodes.sort((left, right) => left.name.localeCompare(right.name));
    for (const node of nodes) {
      sortNodes(node.children);
    }
  };
  sortNodes(roots);

  return roots;
}

type FolderRowProps = {
  node: FolderNode;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  renamingFolderId: string | null;
  movingFolderId: string | null;
  moveTargets: { id: string; name: string; path: string }[];
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentId: string | null) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onStartRename: (folderId: string) => void;
  onStartMove: (folderId: string) => void;
  onCancelEdit: () => void;
  actionLoading: string | null;
};

function FolderRow({
  node,
  level,
  selectedFolderId,
  onSelectFolder,
  renamingFolderId,
  movingFolderId,
  moveTargets,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onStartRename,
  onStartMove,
  onCancelEdit,
  actionLoading,
}: FolderRowProps) {
  const [editName, setEditName] = useState(node.name);
  const [moveParentId, setMoveParentId] = useState<string | null>(node.parentId);
  const inputRef = useRef<HTMLInputElement>(null);
  const isRenaming = renamingFolderId === node.id;
  const isMoving = movingFolderId === node.id;

  const handleRenameSubmit = useCallback(async () => {
    const trimmed = editName.trim();
    if (trimmed && onRenameFolder && trimmed !== node.name) {
      await onRenameFolder(node.id, trimmed);
      onCancelEdit();
    } else {
      onCancelEdit();
    }
  }, [editName, node.id, node.name, onRenameFolder, onCancelEdit]);

  const handleMoveSubmit = useCallback(async () => {
    if (onMoveFolder && moveParentId !== node.parentId) {
      await onMoveFolder(node.id, moveParentId);
      onCancelEdit();
    } else {
      onCancelEdit();
    }
  }, [moveParentId, node.id, node.parentId, onMoveFolder, onCancelEdit]);

  const handleDelete = useCallback(async () => {
    if (onDeleteFolder && window.confirm(`Delete folder "${node.name}"?`)) {
      await onDeleteFolder(node.id);
    }
  }, [node.id, node.name, onDeleteFolder]);

  if (isRenaming) {
    return (
      <li role="treeitem" aria-level={level + 1} aria-selected={selectedFolderId === node.id} className="rv-tree-row-edit">
        <span className="rv-tree-indent" style={{ width: `${level * 0.85}rem` }} aria-hidden />
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
          aria-label="Folder name"
        />
        <Button
          type="button"
          variant="secondary"
          onClick={onCancelEdit}
          aria-label="Cancel rename"
        >
          Cancel
        </Button>
      </li>
    );
  }

  if (isMoving) {
    return (
      <li role="treeitem" aria-level={level + 1} aria-selected={selectedFolderId === node.id} className="rv-tree-row-edit">
        <span className="rv-tree-indent" style={{ width: `${level * 0.85}rem` }} aria-hidden />
        <select
          className="rv-select"
          value={moveParentId ?? ""}
          onChange={(e) => setMoveParentId(e.target.value || null)}
          aria-label="Move to folder"
        >
          <option value="">Root</option>
          {moveTargets.map((t) => (
            <option key={t.id} value={t.id} disabled={t.id === node.id}>
              {t.path}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="secondary"
          disabled={actionLoading === node.id || actionLoading?.endsWith(`:${node.id}`)}
          onClick={() => void handleMoveSubmit()}
          aria-label="Confirm move"
        >
          Move
        </Button>
        <Button type="button" variant="link"  onClick={onCancelEdit} aria-label="Cancel move">
          Cancel
        </Button>
      </li>
    );
  }

  const selected = selectedFolderId === node.id;
  const loading = actionLoading === node.id || actionLoading?.endsWith(`:${node.id}`);

  return (
    <li role="treeitem" aria-selected={selected} aria-level={level + 1}>
      <div className="rv-tree-row">
        <Button
          variant={selected ? "default" : "secondary"}
          className="rv-tree-btn"
          onClick={() => onSelectFolder(node.id)}
          disabled={loading}
        >
          <span
            className="rv-tree-indent"
            aria-hidden="true"
            style={{ width: `${level * 0.85}rem` }}
          />
          {node.name}
          {loading ? <span aria-live="polite"> …</span> : null}
        </Button>
        <div className="rv-tree-actions">
          {onRenameFolder ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                setEditName(node.name);
                onStartRename(node.id);
              }}
              aria-label={`Rename ${node.name}`}
            >
              Rename
            </Button>
          ) : null}
          {onMoveFolder && moveTargets.length > 0 ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                setMoveParentId(node.parentId);
                onStartMove(node.id);
              }}
              aria-label={`Move ${node.name}`}
            >
              Move
            </Button>
          ) : null}
          {onDeleteFolder ? (
            <Button
              type="button"
              variant="link"
              onClick={(e) => {
                e.stopPropagation();
                void handleDelete();
              }}
              className="rv-text-destructive"
              aria-label={`Delete ${node.name}`}
            >
              Delete
            </Button>
          ) : null}
        </div>
      </div>
      {node.children.length > 0 ? (
        <FolderBranch
          nodes={node.children}
          level={level + 1}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          renamingFolderId={renamingFolderId}
          movingFolderId={movingFolderId}
          moveTargets={moveTargets}
          onRenameFolder={onRenameFolder}
          onMoveFolder={onMoveFolder}
          onDeleteFolder={onDeleteFolder}
          onStartRename={onStartRename}
          onStartMove={onStartMove}
          onCancelEdit={onCancelEdit}
          actionLoading={actionLoading ?? ""}
        />
      ) : null}
    </li>
  );
}

function FolderBranch({
  nodes,
  level,
  selectedFolderId,
  onSelectFolder,
  renamingFolderId,
  movingFolderId,
  moveTargets,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  onStartRename,
  onStartMove,
  onCancelEdit,
  actionLoading,
}: {
  nodes: FolderNode[];
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  renamingFolderId: string | null;
  movingFolderId: string | null;
  moveTargets: { id: string; name: string; path: string }[];
  onRenameFolder?: (folderId: string, name: string) => Promise<void>;
  onMoveFolder?: (folderId: string, parentId: string | null) => Promise<void>;
  onDeleteFolder?: (folderId: string) => Promise<void>;
  onStartRename: (folderId: string) => void;
  onStartMove: (folderId: string) => void;
  onCancelEdit: () => void;
  actionLoading: string;
}) {
  return (
    <ul className="rv-tree-list" role={level === 0 ? "tree" : "group"}>
      {nodes.map((node) => (
        <FolderRow
          key={node.id}
          node={node}
          level={level}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          renamingFolderId={renamingFolderId}
          movingFolderId={movingFolderId}
          moveTargets={moveTargets}
          onRenameFolder={onRenameFolder}
          onMoveFolder={onMoveFolder}
          onDeleteFolder={onDeleteFolder}
          onStartRename={onStartRename}
          onStartMove={onStartMove}
          onCancelEdit={onCancelEdit}
          actionLoading={actionLoading}
        />
      ))}
    </ul>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  loading,
  errorMessage,
  onRetry,
  onCreateFolder,
  onRenameFolder,
  onMoveFolder,
  onDeleteFolder,
  actionLoading = null,
  actionError = null,
}: FolderTreeProps) {
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [createName, setCreateName] = useState("");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [movingFolderId, setMovingFolderId] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  const roots = buildTree(folders);
  const flatFolders = flattenFolders(roots);

  const moveTargetsFor = useCallback(
    (folderId: string) => {
      const excluded = getSelfAndDescendantIds(roots, folderId);
      return flatFolders.filter((f) => !excluded.has(f.id));
    },
    [roots, flatFolders],
  );

  const handleCreateSubmit = useCallback(async () => {
    const trimmed = createName.trim();
    if (trimmed && onCreateFolder) {
      await onCreateFolder(trimmed, selectedFolderId);
      setCreateName("");
      setShowCreateInput(false);
    } else {
      setShowCreateInput(false);
    }
  }, [createName, onCreateFolder, selectedFolderId]);

  const handleStartCreate = useCallback(() => {
    setShowCreateInput(true);
    setCreateName("");
    setTimeout(() => createInputRef.current?.focus(), 0);
  }, []);

  const handleCancelCreate = useCallback(() => {
    setShowCreateInput(false);
    setCreateName("");
  }, []);

  const moveTargets = movingFolderId ? moveTargetsFor(movingFolderId) : [];

  return (
    <aside className="rv-tree-shell" aria-label="Folder navigation">
      <div className="rv-tree-header">
        <Button
          variant={selectedFolderId === null ? "default" : "secondary"}
          className="rv-tree-btn"
          onClick={() => onSelectFolder(null)}
        >
          All files
        </Button>
        {onCreateFolder ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleStartCreate}
            aria-label="New folder"
          >
            New folder
          </Button>
        ) : null}
      </div>

      {showCreateInput ? (
        <div className="rv-tree-create" role="form" aria-label="Create folder">
          <input
            ref={createInputRef}
            type="text"
            className="rv-input"
            placeholder="Folder name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreateSubmit();
              if (e.key === "Escape") handleCancelCreate();
            }}
            disabled={actionLoading !== null}
            aria-label="Folder name"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleCreateSubmit()}
            disabled={!createName.trim() || actionLoading !== null}
          >
            Create
          </Button>
          <Button type="button" variant="link"  onClick={handleCancelCreate}>
            Cancel
          </Button>
        </div>
      ) : null}

      {actionError ? (
        <div className="rv-alert" role="alert">
          <p>{actionError}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="rv-list" aria-live="polite" aria-busy="true">
          <Skeleton height={36} />
          <Skeleton height={36} />
          <Skeleton height={36} />
        </div>
      ) : null}

      {!loading && errorMessage ? (
        <div className="rv-alert" role="alert">
          <p>{errorMessage}</p>
          <Button
            type="button"
            variant="link"
            onClick={async () => {
              await onRetry();
            }}
          >
            Retry folders
          </Button>
        </div>
      ) : null}

      {!loading && !errorMessage && roots.length === 0 && !showCreateInput ? (
        <p className="rv-muted">No folders yet.</p>
      ) : null}

      {!loading && !errorMessage && roots.length > 0 ? (
        <FolderBranch
          nodes={roots}
          level={0}
          selectedFolderId={selectedFolderId}
          onSelectFolder={onSelectFolder}
          renamingFolderId={renamingFolderId}
          movingFolderId={movingFolderId}
          moveTargets={moveTargets}
          onRenameFolder={onRenameFolder}
          onMoveFolder={onMoveFolder}
          onDeleteFolder={onDeleteFolder}
          onStartRename={setRenamingFolderId}
          onStartMove={setMovingFolderId}
          onCancelEdit={() => {
            setRenamingFolderId(null);
            setMovingFolderId(null);
          }}
          actionLoading={actionLoading ?? ""}
        />
      ) : null}

      <div className="rv-tree-trash-stub rv-muted" aria-label="Trash stub">
        <small>Trash — full view in Phase 13</small>
      </div>
    </aside>
  );
}
