"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FileItem } from "@/types/api";
import type { ToastType } from "@/components/ui/Toast";

interface FileViewerProps {
  file: FileItem | null;
  onClose: () => void;
  getSignedUrl: (fileId: string, variant: "thumb" | "preview" | "original") => Promise<string | null>;
  addToast: (type: ToastType, message: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileViewer({
  file,
  onClose,
  getSignedUrl,
  addToast,
}: FileViewerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  const loadPreview = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    const url = await getSignedUrl(file.id, "preview");
    setPreviewUrl(url);
    setLoading(false);
  }, [file, getSignedUrl]);

  useEffect(() => {
    if (file) loadPreview();
  }, [file, loadPreview]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (file) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [file]);

  const handleDownload = useCallback(async () => {
    if (!file) return;
    const url = await getSignedUrl(file.id, "original");
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      addToast("success", "Download started");
    } else {
      addToast("error", "Could not get download link");
    }
  }, [file, getSignedUrl, addToast]);

  const handleCopyShare = useCallback(async () => {
    if (!file) return;
    try {
      const res = await fetch(`/api/share/${file.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        addToast("error", data?.error?.message ?? "Failed to create share link");
        return;
      }
      const link = data.link as string;
      await navigator.clipboard.writeText(link);
      addToast("success", "Share link copied to clipboard");
    } catch {
      addToast("error", "Failed to copy share link");
    }
  }, [file, addToast]);

  if (!file) return null;

  const status = file.preview_status;
  const showPlaceholder =
    status === "pending" || status === "processing" || status === "failed" || !previewUrl;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewer: ${file.name}`}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        aria-label="Close viewer"
      >
        Close (Esc)
      </button>

      <div className="flex h-full w-full flex-col md:flex-row">
        <div className="flex flex-1 items-center justify-center overflow-auto p-4">
          {loading && showPlaceholder ? (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <p>Processing…</p>
              <button
                type="button"
                onClick={loadPreview}
                className="rounded bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600"
              >
                Retry
              </button>
            </div>
          ) : status === "failed" ? (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <span className="text-6xl">📷</span>
              <p>Unsupported or failed to generate preview.</p>
              <p className="text-sm">You can still download the original file.</p>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500"
              >
                Download original
              </button>
            </div>
          ) : previewUrl ? (
            <div className="flex items-center justify-center">
              <img
                src={previewUrl}
                alt=""
                className="max-h-[85vh] max-w-full object-contain transition-transform"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-zinc-500">
              <span className="text-6xl">📷</span>
              <p>No preview available.</p>
              <button
                type="button"
                onClick={handleDownload}
                className="rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500"
              >
                Download original
              </button>
            </div>
          )}
        </div>

        <aside
          className="w-full border-t border-zinc-800 bg-zinc-950 p-4 md:w-80 md:border-l md:border-t-0"
          aria-label="File metadata"
        >
          <h3 className="text-sm font-medium text-zinc-400">Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-zinc-500">Name</dt>
              <dd className="mt-0.5 truncate text-zinc-200">{file.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Size</dt>
              <dd className="mt-0.5 text-zinc-200">{formatSize(file.size_bytes)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Type</dt>
              <dd className="mt-0.5 text-zinc-200">
                {file.mime} ({file.ext})
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Updated</dt>
              <dd className="mt-0.5 text-zinc-200">
                {new Date(file.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
            >
              Download original
            </button>
            <button
              type="button"
              onClick={handleCopyShare}
              className="w-full rounded-lg border border-cyan-700 bg-cyan-900/30 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-900/50"
            >
              Copy share link
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="rounded bg-zinc-800 px-3 py-1.5 text-sm hover:bg-zinc-700"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
