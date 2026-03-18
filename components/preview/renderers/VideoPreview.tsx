"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { downloadToBlob, buildStreamUrl, type DownloadProgress } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError, PreviewProgress } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { PREVIEW_SIZE_CAPS } from "@/lib/contracts/preview.contracts";

type VideoPreviewProps = { model: PreviewModel };

type State =
  | { phase: "loading"; progress: DownloadProgress | null }
  | { phase: "ready"; objectUrl: string; contentType: string }
  | { phase: "error"; message: string }
  | { phase: "too_large" }
  | { phase: "aborted" };

export function VideoPreview({ model }: VideoPreviewProps) {
  const [state, setState] = useState<State>({ phase: "loading", progress: null });
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
    const cap = PREVIEW_SIZE_CAPS.video;
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
      return cleanup;
    }

    downloadToBlob(streamUrl, {
      signal: controller.signal,
      onProgress: (p) => setState({ phase: "loading", progress: p }),
    }).then((result) => {
      if (result.ok) {
        const url = URL.createObjectURL(result.blob);
        objectUrlRef.current = url;
        setState({ phase: "ready", objectUrl: url, contentType: result.contentType });
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
      <PreviewProgress fraction={state.progress.fraction} label="Downloading video…" />
    ) : (
      <PreviewLoading label="Downloading video…" />
    );
  }
  if (state.phase === "too_large") {
    return (
      <PreviewError
        title="Video file too large"
        description={`Files over ${Math.round(PREVIEW_SIZE_CAPS.video / 1024 / 1024)}MB cannot be previewed in-app.`}
      />
    );
  }
  if (state.phase === "aborted") return <PreviewError title="Download cancelled" />;
  if (state.phase === "error") {
    return <PreviewError title="Video preview failed" description={state.message} />;
  }

  return (
    <div
      data-testid="preview-video"
      className="w-full h-full flex items-center justify-center"
    >
      <video
        controls
        playsInline
        src={state.objectUrl}
        className="max-w-full max-h-full rounded-lg"
        autoPlay={false}
      >
        <source src={state.objectUrl} type={state.contentType} />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
