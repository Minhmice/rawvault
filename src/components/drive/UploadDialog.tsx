"use client";

import { useCallback, useRef, useState } from "react";
import type { ToastType } from "@/components/ui/Toast";

export interface UploadFileSpec {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  onUploadComplete: () => void;
  addToast: (type: ToastType, message: string) => void;
}

export function UploadDialog({
  open,
  onClose,
  folderId,
  onUploadComplete,
  addToast,
}: UploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<UploadFileSpec[]>([]);
  const [uploading, setUploading] = useState(false);

  const startUpload = useCallback(async () => {
    if (!folderId || items.length === 0) {
      addToast("error", "Select a folder and at least one file.");
      return;
    }

    setUploading(true);
    const specs = items.map((s) => ({ ...s, progress: 0, status: "pending" as const }));
    setItems(specs);

    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId,
          files: specs.map((s) => ({
            name: s.file.name,
            size: s.file.size,
            mime: s.file.type || "application/octet-stream",
          })),
        }),
      });

      const signData = await signRes.json();
      if (!signRes.ok) {
        addToast("error", signData?.error?.message ?? "Failed to get upload URLs");
        setUploading(false);
        return;
      }

      const urls = signData.urls as { name: string; url: string; key: string }[];
      const results: UploadFileSpec[] = [];

      for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const match = urls.find((u) => u.name === spec.file.name);
        if (!match) {
          results.push({
            ...spec,
            progress: 100,
            status: "error",
            error: "No signed URL",
          });
          setItems([...results]);
          continue;
        }

        setItems((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: "uploading" };
          return next;
        });

        try {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const p = Math.round((e.loaded / e.total) * 100);
                setItems((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], progress: p };
                  return next;
                });
              }
            });
            xhr.addEventListener("load", () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`))));
            xhr.addEventListener("error", () => reject(new Error("Network error")));
            xhr.open("PUT", match.url);
            xhr.setRequestHeader("Content-Type", spec.file.type || "application/octet-stream");
            xhr.send(spec.file);
          });

          const ext = spec.file.name.split(".").pop() || "bin";
          const metaRes = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              folderId,
              name: spec.file.name,
              ext,
              mime: spec.file.type || "application/octet-stream",
              size_bytes: spec.file.size,
              storage_key_original: match.key,
            }),
          });

          if (!metaRes.ok) {
            const err = await metaRes.json();
            throw new Error(err?.error?.message ?? "Failed to save file metadata");
          }

          results.push({
            ...spec,
            progress: 100,
            status: "done",
          });
        } catch (err) {
          results.push({
            ...spec,
            progress: 0,
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          });
        }
        setItems([...results]);
      }

      const done = results.filter((r) => r.status === "done").length;
      const failed = results.filter((r) => r.status === "error").length;
      if (done) addToast("success", `${done} file(s) uploaded.`);
      if (failed) addToast("error", `${failed} file(s) failed.`);
      onUploadComplete();
    } catch (e) {
      addToast("error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [folderId, items, onUploadComplete, addToast]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    const newItems: UploadFileSpec[] = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-dialog-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
        <h2 id="upload-dialog-title" className="text-lg font-semibold text-zinc-100">
          Upload files
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {folderId ? "Files will be uploaded to the current folder." : "Select a folder first (e.g. My Drive)."}
        </p>

        <div className="mt-4">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,.raw,.arw,.cr2,.cr3,.nef,.dng,.orf,.rw2,.raf"
            onChange={onFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-dashed border-zinc-600 py-3 w-full text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 disabled:opacity-50"
          >
            Choose files
          </button>
        </div>

        {items.length > 0 && (
          <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {items.map((item, i) => (
              <li
                key={`${item.file.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded bg-zinc-800 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-zinc-300">{item.file.name}</span>
                <div className="flex shrink-0 items-center gap-2">
                  {item.status === "uploading" && (
                    <span className="text-xs text-zinc-500">{item.progress}%</span>
                  )}
                  {item.status === "done" && (
                    <span className="text-emerald-400" aria-hidden>✓</span>
                  )}
                  {item.status === "error" && (
                    <span className="text-red-400 text-xs" title={item.error}>
                      Error
                    </span>
                  )}
                  {!uploading && item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-zinc-500 hover:text-zinc-300"
                      aria-label={`Remove ${item.file.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={startUpload}
            disabled={uploading || items.length === 0 || !folderId}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
