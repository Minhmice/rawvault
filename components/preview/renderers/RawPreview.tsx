"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadToBlob, buildStreamUrl, type DownloadProgress } from "@/lib/preview/download-blob";
import { extractRawPreview } from "@/lib/preview/raw-extractor";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { PREVIEW_SIZE_CAPS } from "@/lib/contracts/preview.contracts";

function PreviewLoading({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

function PreviewProgress({ fraction, label }: { fraction: number | null; label?: string }) {
  const pct = fraction != null ? Math.round(fraction * 100) : null;
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full h-full text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
      {label && <p className="text-sm">{label}</p>}
      {pct != null && (
        <div className="w-48 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-150"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {pct != null && <span className="text-xs">{pct}%</span>}
    </div>
  );
}

function PreviewError({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full text-muted-foreground px-6 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs">{description}</p>}
    </div>
  );
}

type RawPreviewProps = {
  model: PreviewModel;
};

type State =
  | { phase: "downloading"; progress: DownloadProgress | null }
  | { phase: "extracting" }
  | { phase: "ready"; objectUrl: string }
  | { phase: "no_preview" }
  | { phase: "error"; message: string }
  | { phase: "too_large" }
  | { phase: "aborted" };

export function RawPreview({ model }: RawPreviewProps) {
  const [state, setState] = useState<State>({ phase: "downloading", progress: null });
  const [zoom, setZoom] = useState(1);
  const abortRef = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    abortRef.current?.abort();
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const cap = PREVIEW_SIZE_CAPS.raw_embedded;
    if (model.sizeBytes != null && model.sizeBytes > cap) {
      setState({ phase: "too_large" });
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const streamUrl =
      model.source.streamUrl ??
      (model.source.fileId ? buildStreamUrl(model.source.fileId) : null);

    if (!streamUrl) {
      setState({ phase: "error", message: "No stream URL available" });
      return;
    }

    (async () => {
      const result = await downloadToBlob(streamUrl, {
        signal: controller.signal,
        onProgress: (progress) => setState({ phase: "downloading", progress }),
      });

      if (!result.ok) {
        if (result.reason === "aborted") {
          setState({ phase: "aborted" });
        } else {
          setState({ phase: "error", message: result.message ?? "Download failed" });
        }
        return;
      }

      setState({ phase: "extracting" });
      const buffer = await result.blob.arrayBuffer();
      const extraction = await extractRawPreview(buffer);

      if (!extraction.success) {
        setState({ phase: "no_preview" });
        return;
      }

      const url = URL.createObjectURL(extraction.blob);
      objectUrlRef.current = url;
      setState({ phase: "ready", objectUrl: url });
    })();

    return cleanup;
  }, [model, cleanup]);

  if (state.phase === "downloading") {
    return state.progress ? (
      <PreviewProgress fraction={state.progress.fraction} label="Downloading RAW file…" />
    ) : (
      <PreviewLoading label="Downloading RAW file…" />
    );
  }

  if (state.phase === "extracting") {
    return <PreviewLoading label="Extracting preview…" />;
  }

  if (state.phase === "too_large") {
    return (
      <PreviewError
        title="RAW file too large to preview"
        description={`Files over ${Math.round(PREVIEW_SIZE_CAPS.raw_embedded / 1024 / 1024)}MB cannot be previewed in-app.`}
      />
    );
  }

  if (state.phase === "no_preview") {
    return (
      <PreviewError
        title="No embedded preview"
        description="This RAW file does not contain an embedded JPEG preview. Download the file to view it in a RAW editor."
      />
    );
  }

  if (state.phase === "aborted") {
    return <PreviewError title="Download cancelled" />;
  }

  if (state.phase === "error") {
    return <PreviewError title="RAW preview failed" description={state.message} />;
  }

  return (
    <div className={cn("flex flex-col items-center gap-3 w-full h-full")}>
      <div className="flex items-center gap-1 rounded-lg bg-muted/80 px-2 py-1 shrink-0">
        <button
          onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.min(4, z + 0.25))}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto flex items-center justify-center w-full min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-testid="preview-raw"
          src={state.objectUrl}
          alt={`RAW preview: ${model.title}`}
          className="max-w-full max-h-full object-contain transition-transform duration-150"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
