"use client";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ProviderBadge } from "../account-management/provider-badge";
import { Skeleton } from "../ui/skeleton";
import type { ExplorerFileItem } from "./contracts";

type AsyncState = "idle" | "loading" | "error" | "success";

function previewTone(status: ExplorerFileItem["previewStatus"]) {
  if (status === "ready") return "success";
  if (status === "failed") return "default";
  return "muted";
}

function previewLabel(status: ExplorerFileItem["previewStatus"]) {
  switch (status) {
    case "ready":
      return "Preview ready";
    case "failed":
      return "Preview failed";
    case "processing":
      return "Preview processing";
    default:
      return "Preview pending";
  }
}

type FileDetailPanelProps = {
  selectedFileId: string | null;
  fileDetail: ExplorerFileItem | null;
  detailState: AsyncState;
  detailError: string | null;
  onRetry: () => void;
};

export function FileDetailPanel({
  selectedFileId,
  fileDetail,
  detailState,
  detailError,
  onRetry,
}: FileDetailPanelProps) {
  if (!selectedFileId) {
    return (
      <section
        className="rv-detail-panel rv-detail-panel-empty"
        aria-label="File detail panel"
      >
        <p className="rv-muted">Select a file from the list to view details.</p>
      </section>
    );
  }

  if (detailState === "loading") {
    return (
      <section
        className="rv-detail-panel"
        aria-label="File detail panel"
        aria-busy="true"
      >
        <div className="rv-list" aria-live="polite">
          <Skeleton height={72} />
          <Skeleton height={48} />
        </div>
      </section>
    );
  }

  if (detailState === "error" && detailError) {
    return (
      <section className="rv-detail-panel" aria-label="File detail panel">
        <div className="rv-alert" role="alert">
          <p>{detailError}</p>
          <Button variant="link" type="button" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </section>
    );
  }

  if (detailState === "success" && fileDetail) {
    return (
      <section className="rv-detail-panel" aria-label="File detail panel">
        <div className="rv-stack" style={{ gap: "0.75rem" }}>
          <div className="rv-inline" style={{ flexWrap: "wrap", gap: "0.5rem" }}>
            <strong>{fileDetail.name}</strong>
            <ProviderBadge provider={fileDetail.provider} />
            <Badge tone={previewTone(fileDetail.previewStatus)}>
              {previewLabel(fileDetail.previewStatus)}
            </Badge>
          </div>
          <div className="rv-meta">
            <span>Size: {fileDetail.sizeBytes.toLocaleString()} bytes</span>
            <span>MIME: {fileDetail.mime ?? "n/a"}</span>
            <span>Extension: {fileDetail.ext ?? "n/a"}</span>
            <span>Folder: {fileDetail.folderId ?? "root"}</span>
            <span>Sync: {fileDetail.syncStatus}</span>
            {fileDetail.errorCode ? (
              <span>Preview error: {fileDetail.errorCode}</span>
            ) : null}
            <span>Updated: {new Date(fileDetail.updatedAt).toLocaleString()}</span>
          </div>
          <div className="rv-detail-deferrals rv-inline" style={{ gap: "0.5rem" }}>
            <a
              href={`/api/files/${fileDetail.id}/download`}
              className="rv-link"
              download={fileDetail.name}
              target="_blank"
              rel="noopener noreferrer"
            >
              Download
            </a>
            <small className="rv-muted">Share — Phase 11</small>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
