"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadToBlob, buildStreamUrl, type DownloadProgress } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError, PreviewProgress } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";

type ImagePreviewProps = {
  model: PreviewModel;
};

type State =
  | { phase: "loading"; progress: DownloadProgress | null }
  | { phase: "ready"; objectUrl: string }
  | { phase: "error"; message: string }
  | { phase: "aborted" };

export function ImagePreview({ model }: ImagePreviewProps) {
  const [state, setState] = useState<State>({ phase: "loading", progress: null });
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<"contain" | "actual">("contain");
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
    const controller = new AbortController();
    abortRef.current = controller;

    const streamUrl =
      model.source.streamUrl ??
      (model.source.fileId ? buildStreamUrl(model.source.fileId) : null);
    if (!streamUrl) {
      setState({ phase: "error", message: "No stream URL available" });
      return cleanup;
    }

    downloadToBlob(streamUrl, {
      signal: controller.signal,
      onProgress: (progress) => setState({ phase: "loading", progress }),
    }).then((result) => {
      if (result.ok) {
        const url = URL.createObjectURL(result.blob);
        objectUrlRef.current = url;
        setState({ phase: "ready", objectUrl: url });
      } else if (result.reason === "aborted") {
        setState({ phase: "aborted" });
      } else {
        setState({ phase: "error", message: result.message ?? "Download failed" });
      }
    });

    return cleanup;
  }, [model, cleanup]);

  if (state.phase === "loading") {
    return state.progress ? (
      <PreviewProgress fraction={state.progress.fraction} />
    ) : (
      <PreviewLoading />
    );
  }

  if (state.phase === "aborted") {
    return <PreviewError title="Download cancelled" />;
  }

  if (state.phase === "error") {
    return <PreviewError title="Image preview failed" description={state.message} />;
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full h-full">
      {/* Zoom controls */}
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
        <button
          onClick={() => {
            setFitMode((m) => (m === "contain" ? "actual" : "contain"));
            setZoom(1);
          }}
          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle fit mode"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 overflow-auto flex items-center justify-center w-full min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-testid="preview-image"
          src={state.objectUrl}
          alt={model.title}
          className={cn(
            "transition-transform duration-150",
            fitMode === "contain" ? "max-w-full max-h-full object-contain" : "max-w-none",
          )}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          draggable={false}
        />
      </div>
    </div>
  );
}
