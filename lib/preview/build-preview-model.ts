import type { ExplorerFile } from "@/lib/contracts";
import type { UnifiedExplorerItem } from "@/lib/contracts/explorer-list.contracts";
import type { PreviewModel } from "@/lib/contracts/preview.contracts";
import { buildDownloadUrl, buildStreamUrl } from "@/lib/preview/download-blob";
import { resolvePreview } from "@/lib/preview/file-type-resolver";

export function buildPreviewModel(file: ExplorerFile): PreviewModel {
  const resolved = resolvePreview(file.mime, file.name, file.sizeBytes);
  const kind = resolved.kind;
  const unsupportedReason = resolved.kind === "unsupported" ? resolved.reason : undefined;

  return {
    kind,
    title: file.name,
    mimeType: file.mime,
    sizeBytes: file.sizeBytes,
    source: {
      fileId: file.id,
      providerFileId: file.providerFileId ?? undefined,
      streamUrl: buildStreamUrl(file.id),
      downloadUrl: buildDownloadUrl(file.id),
      provider: file.provider === "gdrive" ? "gdrive" : file.provider === "onedrive" ? "onedrive" : undefined,
    },
    unsupportedReason,
  };
}

/**
 * Build a PreviewModel from a UnifiedExplorerItem (provider-native file).
 * These files don't have an app UUID — they use the explorer stream URL instead.
 */
export function buildPreviewModelFromUnified(
  file: UnifiedExplorerItem,
  accountProvider?: "gdrive" | "onedrive",
): PreviewModel {
  const resolved = resolvePreview(file.mimeType, file.name, file.sizeBytes);
  const kind = resolved.kind;
  const unsupportedReason = resolved.kind === "unsupported" ? resolved.reason : undefined;

  const streamUrl = `/api/explorer/stream?accountId=${encodeURIComponent(file.accountId)}&providerFileId=${encodeURIComponent(file.providerId)}&name=${encodeURIComponent(file.name)}`;
  const downloadUrl = `${streamUrl}&download=1`;

  return {
    kind,
    title: file.name,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    source: {
      providerFileId: file.providerId,
      streamUrl,
      thumbnailUrl: file.thumbnailUrl,
      downloadUrl,
      provider: accountProvider,
    },
    unsupportedReason,
  };
}
