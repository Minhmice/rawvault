import type { ExplorerFile } from "@/lib/contracts";
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
