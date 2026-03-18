"use client";

import React from "react";
import { FileText, ExternalLink, Download } from "lucide-react";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { buildDownloadUrl } from "@/lib/preview/download-blob";

type OfficeFallbackProps = {
  model: PreviewModel;
  onDownload?: () => void;
};

export function OfficeFallback({ model, onDownload }: OfficeFallbackProps) {
  const providerFileId = model.source.providerFileId;
  const canOpenInGoogle = model.source.provider === "gdrive" && !!providerFileId;

  const handleOpenInGoogle = () => {
    if (!canOpenInGoogle || !providerFileId) return;
    window.open(
      `https://drive.google.com/open?id=${encodeURIComponent(providerFileId)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    if (model.source.fileId) {
      window.location.href = buildDownloadUrl(model.source.fileId);
    }
  };

  return (
    <div
      data-testid="preview-office-fallback"
      className="flex flex-col items-center justify-center gap-6 text-center max-w-sm"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted">
        <FileText className="h-9 w-9 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{model.title}</p>
        <p className="text-xs text-muted-foreground">
          In-app preview is not supported for this file type yet.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
          aria-label="Download file"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
        {canOpenInGoogle && (
          <button
            onClick={handleOpenInGoogle}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
            aria-label="Open in Google Drive"
          >
            <ExternalLink className="h-4 w-4" />
            Open in Google
          </button>
        )}
      </div>
    </div>
  );
}
