"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileItem } from "@/types/api";

interface FileGridProps {
  files: FileItem[];
  loading?: boolean;
  onFileOpen: (file: FileItem) => void;
  getThumbUrl: (fileId: string) => Promise<string | null>;
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

function FileCard({
  file,
  onOpen,
  getThumbUrl,
}: {
  file: FileItem;
  onOpen: () => void;
  getThumbUrl: (fileId: string) => Promise<string | null>;
}) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getThumbUrl(file.id).then((url) => {
      if (mounted.current) {
        setThumbUrl(url);
        setLoaded(true);
      }
    });
    return () => {
      mounted.current = false;
      if (thumbUrl?.startsWith("blob:") || thumbUrl?.startsWith("http")) {
        // signed URL, no revoke needed for blob
      }
    };
  }, [file.id, getThumbUrl]);

  const isRaw = /raw|arw|cr2|nef|orf|dng|raf/i.test(file.ext);
  const status = file.preview_status;
  const showPlaceholder = status === "pending" || status === "processing" || status === "failed" || !thumbUrl;

  return (
    <button
      type="button"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="group flex w-full flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition hover:border-zinc-600 hover:bg-zinc-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-zinc-800">
        {showPlaceholder ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-500">
            <span className="text-3xl" aria-hidden>📷</span>
            <span className="text-xs">
              {status === "failed" ? "Unsupported" : "Processing…"}
            </span>
          </div>
        ) : thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">{file.name}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
          {isRaw && (
            <span className="rounded bg-violet-900/50 px-1.5 py-0.5 text-violet-300">
              RAW
            </span>
          )}
          <span>{formatDate(file.updated_at)}</span>
        </div>
      </div>
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="flex w-full flex-col rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="aspect-square w-full animate-pulse rounded-md bg-zinc-800" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-zinc-700" />
      <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-zinc-700" />
    </div>
  );
}

export function FileGrid({ files, loading, onFileOpen, getThumbUrl }: FileGridProps) {
  const handleOpen = useCallback(
    (file: FileItem) => () => onFileOpen(file),
    [onFileOpen]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <GridSkeleton key={i} />
        ))}
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
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      role="list"
    >
      {files.map((file) => (
        <div key={file.id} role="listitem">
          <FileCard
            file={file}
            onOpen={handleOpen(file)}
            getThumbUrl={getThumbUrl}
          />
        </div>
      ))}
    </div>
  );
}
