"use client";

import React, { useEffect, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildStreamUrl } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";

export function ImagePreview({ model }: { model: PreviewModel }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitMode, setFitMode] = useState<"contain" | "cover">("cover");

  const streamUrl =
    model.source.streamUrl ??
    (model.source.fileId ? buildStreamUrl(model.source.fileId) : null);
  const thumbnailUrl = model.source.thumbnailUrl ?? null;
  const primarySrc = thumbnailUrl ?? streamUrl;
  const [currentSrc, setCurrentSrc] = useState<string | null>(primarySrc);
  const [streamFallbackTried, setStreamFallbackTried] = useState(primarySrc === streamUrl);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setZoom(1);
    setFitMode("cover");
    setCurrentSrc(primarySrc);
    setStreamFallbackTried(primarySrc === streamUrl);
  }, [primarySrc, streamUrl]);

  if (!currentSrc) {
    return <PreviewError title="Image preview failed" description="No preview source available" />;
  }

  if (error) {
    return <PreviewError title="Image preview failed" description="Failed to load image" />;
  }

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {loaded && (
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
              setFitMode((m) => (m === "contain" ? "cover" : "contain"));
              setZoom(1);
            }}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle fit mode"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex items-center justify-center w-full h-full relative">
        {!loaded && <PreviewLoading />}
        <img
          key={currentSrc}
          data-testid="preview-image"
          src={currentSrc}
          alt={model.title}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!streamFallbackTried && streamUrl && currentSrc !== streamUrl) {
              setLoaded(false);
              setError(false);
              setCurrentSrc(streamUrl);
              setStreamFallbackTried(true);
              return;
            }
            setError(true);
          }}
          className={cn(
            "transition-transform duration-150",
            fitMode === "contain" ? "object-contain" : "object-cover w-full h-full",
            !loaded && "absolute opacity-0 w-0 h-0 pointer-events-none",
          )}
          style={loaded ? { transform: `scale(${zoom})`, transformOrigin: "center center" } : undefined}
          draggable={false}
        />
      </div>
    </div>
  );
}
