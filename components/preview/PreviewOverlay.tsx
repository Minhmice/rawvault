"use client";

import React, { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";

export type PreviewOverlayProps = {
  open: boolean;
  onClose: () => void;
  model: PreviewModel | null;
  children?: React.ReactNode;
  onDownload?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export function PreviewOverlay({
  open,
  onClose,
  model,
  children,
  onDownload,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: PreviewOverlayProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      if (e.key === "ArrowRight" && hasNext) onNext?.();
    },
    [onClose, onPrev, onNext, hasPrev, hasNext],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, handleKeyDown]);

  if (!open || !model) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {hasPrev && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-2 sm:left-6 z-20 rounded-full bg-background/80 hover:bg-background p-2 text-foreground transition-colors shadow-lg"
          aria-label="Previous file"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {hasNext && onNext && (
        <button
          onClick={onNext}
          className="absolute right-2 sm:right-6 z-20 rounded-full bg-background/80 hover:bg-background p-2 text-foreground transition-colors shadow-lg"
          aria-label="Next file"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      <div
        data-testid="preview-overlay"
        role="dialog"
        aria-modal="true"
        aria-label={`Preview: ${model.title}`}
        className="relative z-10 flex flex-col bg-background rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-border/50"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3 shrink-0">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate text-foreground">
              {model.title}
            </span>
            {model.mimeType && (
              <span className="text-xs text-muted-foreground truncate">
                {model.mimeType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onDownload && (
              <button
                data-testid="preview-download-button"
                onClick={onDownload}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
                aria-label="Download file"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>
            )}
            <button
              data-testid="preview-close-button"
              onClick={onClose}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          data-testid="preview-content"
          className="flex-1 overflow-auto flex items-center justify-center min-h-0 p-0"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function PreviewLoading({ label }: { label?: string }) {
  return (
    <div
      data-testid="preview-loading"
      className="flex flex-col items-center justify-center gap-3 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  );
}

export function PreviewError({
  title = "Preview unavailable",
  description,
  actions,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      data-testid="preview-error"
      className="flex flex-col items-center justify-center gap-4 text-center max-w-sm"
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function PreviewProgress({
  fraction,
  label,
}: {
  fraction: number | null;
  label?: string;
}) {
  return (
    <div
      data-testid="preview-progress"
      className="flex flex-col items-center justify-center gap-3 w-full max-w-xs"
      role="status"
      aria-live="polite"
    >
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full bg-primary transition-all duration-200",
            fraction === null && "animate-pulse w-full",
          )}
          style={fraction !== null ? { width: `${Math.round(fraction * 100)}%` } : undefined}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {label ?? (fraction !== null ? `${Math.round(fraction * 100)}%` : "Downloading…")}
      </span>
    </div>
  );
}
