"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";

type GoogleRedirectProps = { model: PreviewModel };

export function buildGoogleOpenUrl(providerFileId: string): string {
  return `https://drive.google.com/open?id=${encodeURIComponent(providerFileId)}`;
}

export function GoogleRedirect({ model }: GoogleRedirectProps) {
  const providerFileId = model.source.providerFileId;

  const handleOpen = () => {
    if (!providerFileId) return;
    window.open(buildGoogleOpenUrl(providerFileId), "_blank", "noopener,noreferrer");
  };

  return (
    <div
      data-testid="preview-google-redirect"
      className="flex flex-col items-center justify-center gap-6 text-center max-w-sm"
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-muted">
        <ExternalLink className="h-9 w-9 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{model.title}</p>
        <p className="text-xs text-muted-foreground">
          This file opens in Google&apos;s editor.
        </p>
      </div>
      {providerFileId ? (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          aria-label="Open in Google"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Google
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">No link available for this file.</p>
      )}
    </div>
  );
}
