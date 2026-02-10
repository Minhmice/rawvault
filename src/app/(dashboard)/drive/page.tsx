"use client";

import { useCallback, useEffect, useState } from "react";
import { FileGrid } from "@/components/drive/FileGrid";
import { FileList } from "@/components/drive/FileList";
import { FileViewer } from "@/components/drive/FileViewer";
import { UploadDialog } from "@/components/drive/UploadDialog";
import { useToast } from "@/hooks/useToast";
import type { FileItem, FolderItem } from "@/types/api";

export default function DrivePage() {
  const { add: addToast } = useToast();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewerFile, setViewerFile] = useState<FileItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders?parentId=root");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.data ?? []);
        if ((data.data?.length ?? 0) > 0 && !currentFolderId) {
          setCurrentFolderId(data.data[0].id);
        }
      }
    } catch {
      addToast("error", "Failed to load folders");
    }
  }, [currentFolderId]);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (currentFolderId) params.set("folderId", currentFolderId);
      params.set("limit", "50");
      params.set("sort", "updated_at");
      params.set("order", "desc");
      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.data ?? []);
      } else {
        addToast("error", "Failed to load files");
      }
    } catch {
      addToast("error", "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [currentFolderId, addToast]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const handler = () => setUploadOpen(true);
    window.addEventListener("rawvault:upload-click", handler);
    return () => window.removeEventListener("rawvault:upload-click", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) =>
      setSearchQuery((e as CustomEvent<{ q: string }>).detail?.q ?? "");
    window.addEventListener("rawvault:search", handler);
    return () => window.removeEventListener("rawvault:search", handler);
  }, []);

  const getSignedUrl = useCallback(
    async (fileId: string, variant: "thumb" | "preview" | "original") => {
      try {
        const res = await fetch(
          `/api/files/${fileId}/signed-url?variant=${variant}`
        );
        const data = await res.json();
        return data.url ?? null;
      } catch {
        return null;
      }
    },
    []
  );

  const getThumbUrl = useCallback(
    (fileId: string) => getSignedUrl(fileId, "thumb"),
    [getSignedUrl]
  );

  const handleCreateFolder = useCallback(async () => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New folder" }),
      });
      if (res.ok) {
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setCurrentFolderId(folder.id);
        addToast("success", "Folder created");
      } else {
        const err = await res.json();
        addToast("error", err?.error?.message ?? "Failed to create folder");
      }
    } catch {
      addToast("error", "Failed to create folder");
    }
  }, [addToast]);

  const currentFolder = folders.find((f) => f.id === currentFolderId);
  const filteredFiles =
    searchQuery.trim() === ""
      ? files
      : files.filter((f) =>
          f.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
        );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            My Drive
          </button>
          {currentFolder && (
            <>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-200">{currentFolder.name}</span>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateFolder}
            className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            New folder
          </button>
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-sm ${viewMode === "grid" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 text-sm ${viewMode === "list" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
            >
              List
            </button>
          </div>
        </div>
      </div>

      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {folders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCurrentFolderId(f.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm ${currentFolderId === f.id ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"}`}
            >
              📁 {f.name}
            </button>
          ))}
        </div>
      )}

      {viewMode === "grid" ? (
        <FileGrid
          files={filteredFiles}
          loading={loading}
          onFileOpen={setViewerFile}
          getThumbUrl={getThumbUrl}
        />
      ) : (
        <FileList
          files={filteredFiles}
          loading={loading}
          onFileOpen={setViewerFile}
          getThumbUrl={getThumbUrl}
        />
      )}

      <FileViewer
        file={viewerFile}
        onClose={() => setViewerFile(null)}
        getSignedUrl={getSignedUrl}
        addToast={addToast}
      />

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={currentFolderId ?? folders[0]?.id ?? null}
        onUploadComplete={() => {
          fetchFiles();
          setUploadOpen(false);
        }}
        addToast={addToast}
      />
    </div>
  );
}
