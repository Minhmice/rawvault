"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { downloadToBlob, buildStreamUrl, type DownloadProgress } from "@/lib/preview/download-blob";
import { PreviewLoading, PreviewError, PreviewProgress } from "@/components/preview/PreviewOverlay";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { PREVIEW_SIZE_CAPS } from "@/lib/contracts/preview.contracts";

type PdfPreviewProps = {
  model: PreviewModel;
};

type State =
  | { phase: "loading"; progress: DownloadProgress | null }
  | { phase: "ready"; objectUrl: string }
  | { phase: "error"; message: string }
  | { phase: "too_large" }
  | { phase: "aborted" };

export function PdfPreview({ model }: PdfPreviewProps) {
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
    const cap = PREVIEW_SIZE_CAPS.pdf;
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
      <PreviewProgress fraction={state.progress.fraction} label="Loading PDF…" />
    ) : (
      <PreviewLoading label="Loading PDF…" />
    );
  }

  if (state.phase === "too_large") {
    return (
      <PreviewError
        title="PDF too large to preview"
        description={`Files over ${Math.round(PREVIEW_SIZE_CAPS.pdf / 1024 / 1024)}MB cannot be previewed in-app. Please download instead.`}
      />
    );
  }

  if (state.phase === "aborted") {
    return <PreviewError title="Download cancelled" />;
  }

  if (state.phase === "error") {
    return <PreviewError title="PDF preview failed" description={state.message} />;
  }

  return (
    <div
      data-testid="preview-pdf"
      className="w-full h-full flex flex-col min-h-0"
    >
      <object
        data={state.objectUrl}
        type="application/pdf"
        className="w-full flex-1 min-h-0 rounded-lg"
        aria-label="PDF document"
      >
        <PreviewError
          title="PDF cannot be displayed"
          description="Your browser does not support inline PDF viewing."
        />
      </object>
    </div>
  );
}
