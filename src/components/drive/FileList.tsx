"use client";

import { useCallback, useEffect, useState } from "react";
import type { FileItem } from "@/types/api";

interface FileListProps {
  files: FileItem[];
  loading?: boolean;
  onFileOpen: (file: FileItem) => void;
  getThumbUrl: (fileId: string) => Promise<string | null>;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function ListRow({
  file,
  onOpen,
  getThumbUrl,
}: {
  file: FileItem;
  onOpen: () => void;
  getThumbUrl: (fileId: string) => Promise<string | null>;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const isRaw = /raw|arw|cr2|nef|orf|dng|raf/i.test(file.ext);
  const status = file.preview_status;

  useEffect(() => {
    getThumbUrl(file.id).then(setThumbUrl);
  }, [file.id, getThumbUrl]);

  const showPlaceholder = status === "pending" || status === "processing" || status === "failed" || !thumbUrl;

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-800/30">
      <td className="py-2 pr-2">
        <button
          type="button"
          onClick={onOpen}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onOpen())}
          className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-zinc-800">
            {showPlaceholder ? (
              <div className="flex h-full w-full items-center justify-center text-lg text-zinc-500">
                📷
              </div>
            ) : thumbUrl ? (
              <img
                src={thumbUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                …
              </div>
            )}
          </div>
          <span className="font-medium text-zinc-200">{file.name}</span>
        </button>
      </td>
      <td className="py-2 text-sm text-zinc-500">{formatSize(file.size_bytes)}</td>
      <td className="py-2 text-sm text-zinc-500">{formatDate(file.updated_at)}</td>
      <td className="py-2">
        {isRaw && (
          <span className="rounded bg-violet-900/50 px-1.5 py-0.5 text-xs text-violet-300">
            RAW
          </span>
        )}
      </td>
      <td className="w-10 py-2">
        <button
          type="button"
          onClick={(e) => (e.stopPropagation(), onOpen())}
          className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
          aria-label={`Open ${file.name}`}
        >
          ⋮
        </button>
      </td>
    </tr>
  );
}

export function FileList({ files, loading, onFileOpen, getThumbUrl }: FileListProps) {
  const handleOpen = useCallback(
    (file: FileItem) => () => onFileOpen(file),
    [onFileOpen]
  );

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="py-3 pl-4 text-left text-sm font-medium text-zinc-400">Name</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">Size</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">Updated</th>
              <th className="py-3 text-left text-sm font-medium text-zinc-400">Type</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-800">
                <td className="py-2 pl-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 animate-pulse rounded bg-zinc-700" />
                    <div className="h-4 w-32 animate-pulse rounded bg-zinc-700" />
                  </div>
                </td>
                <td className="py-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-zinc-700" />
                </td>
                <td className="py-2">
                  <div className="h-4 w-24 animate-pulse rounded bg-zinc-700" />
                </td>
                <td className="py-2" />
                <td className="w-10" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-16 text-center"
        role="status"
        aria-label="No files"
      >
        <p className="text-zinc-500">No files here yet.</p>
        <p className="mt-1 text-sm text-zinc-600">
          Upload files or create a folder to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="py-3 pl-4 text-left text-sm font-medium text-zinc-400">Name</th>
            <th className="py-3 text-left text-sm font-medium text-zinc-400">Size</th>
            <th className="py-3 text-left text-sm font-medium text-zinc-400">Updated</th>
            <th className="py-3 text-left text-sm font-medium text-zinc-400">Type</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <ListRow
              key={file.id}
              file={file}
              onOpen={handleOpen(file)}
              getThumbUrl={getThumbUrl}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
