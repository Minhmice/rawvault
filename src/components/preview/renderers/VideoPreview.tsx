"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { buildStreamUrl } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { PREVIEW_SIZE_CAPS } from "@/lib/contracts/preview.contracts";

type VideoPreviewProps = { model: PreviewModel };

type State =
  | { phase: "loading" }
  | { phase: "ready" }
  | { phase: "error"; message: string }
  | { phase: "too_large" };

export function VideoPreview({ model }: VideoPreviewProps) {
  const [state, setState] = useState<State>({ phase: "loading" });
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    const cap = PREVIEW_SIZE_CAPS.video;
    if (model.sizeBytes != null && model.sizeBytes > cap) {
      setState({ phase: "too_large" });
      return;
    }

    const streamUrl =
      model.source.streamUrl ??
      (model.source.fileId ? buildStreamUrl(model.source.fileId) : null);
    if (!streamUrl) {
      setState({ phase: "error", message: "No stream URL available" });
      return cleanup;
    }

    setState({ phase: "loading" });
    return cleanup;
  }, [model, cleanup]);

  if (state.phase === "loading") {
    return <PreviewLoading label="Loading video…" />;
  }
  if (state.phase === "too_large") {
    return (
      <PreviewError
        title="Video file too large"
        description={`Files over ${Math.round(PREVIEW_SIZE_CAPS.video / 1024 / 1024)}MB cannot be previewed in-app.`}
      />
    );
  }
  if (state.phase === "error") {
    return <PreviewError title="Video preview failed" description={state.message} />;
  }

  const streamUrl =
    model.source.streamUrl ??
    (model.source.fileId ? buildStreamUrl(model.source.fileId) : null);

  return (
    <div data-testid="preview-video" className="w-full h-full flex items-center justify-center min-h-0">
      <video
        key={streamUrl}
        ref={videoRef}
        controls
        playsInline
        autoPlay
        src={streamUrl ?? undefined}
        className="max-w-full max-h-full rounded-lg"
        onLoadedMetadata={() => setState({ phase: "ready" })}
        onError={(e) => {
          const target = e.target as HTMLVideoElement;
          setState({ phase: "error", message: target.error?.message ?? "Failed to load video" });
        }}
      />
    </div>
  );
}
