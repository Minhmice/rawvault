"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Music } from "lucide-react";
import { downloadToBlob, buildStreamUrl, type DownloadProgress } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError, PreviewProgress } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { PREVIEW_SIZE_CAPS } from "@/lib/contracts/preview.contracts";

type AudioPreviewProps = { model: PreviewModel };

type State =
  | { phase: "loading"; progress: DownloadProgress | null }
  | { phase: "ready"; objectUrl: string; contentType: string }
  | { phase: "error"; message: string }
  | { phase: "too_large" }
  | { phase: "aborted" };

export function AudioPreview({ model }: AudioPreviewProps) {
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
    const cap = PREVIEW_SIZE_CAPS.audio;
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
      <PreviewProgress fraction={state.progress.fraction} label="Downloading audio…" />
    ) : (
      <PreviewLoading label="Downloading audio…" />
    );
  }
  if (state.phase === "too_large") {
    return (
      <PreviewError
        title="Audio file too large"
        description={`Files over ${Math.round(PREVIEW_SIZE_CAPS.audio / 1024 / 1024)}MB cannot be previewed in-app.`}
      />
    );
  }
  if (state.phase === "aborted") return <PreviewError title="Download cancelled" />;
  if (state.phase === "error") {
    return <PreviewError title="Audio preview failed" description={state.message} />;
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <div className="flex items-center justify-center w-24 h-24 rounded-full bg-muted">
        <Music className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground text-center truncate max-w-full">
        {model.title}
      </p>
      <audio
        data-testid="preview-audio"
        controls
        src={state.objectUrl}
        className="w-full"
        autoPlay={false}
      >
        <source src={state.objectUrl} type={state.contentType} />
        Your browser does not support audio playback.
      </audio>
    </div>
  );
}
