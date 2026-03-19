/**
 * Public share file stream.
 * GET /api/share/v/[token]/stream — streams shared file content (no auth).
 * Respects allow_download: if false, only inline preview; ?download=1 returns 403.
 * For files with is_split or viewer_mode=download_only, inline stream returns 403; use ?download=1.
 */

import { ApiError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/responses";
import {
  accessFileContentForShare,
  resolveFileForShareAccess,
} from "@/lib/file-access/service";
import { resolveShareByToken } from "@/lib/share/service";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

function escapeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "_").slice(0, 200);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const supabase = createServiceRoleSupabaseClient();

    if (!supabase) {
      throw new ApiError(
        500,
        "SERVER_MISCONFIGURED",
        "Service role client not available for share stream.",
      );
    }

    const { shareLink } = await resolveShareByToken(supabase, token);

    const url = new URL(request.url);
    const fileIdParam = url.searchParams.get("fileId");
    let fileId: string;

    if (shareLink.resourceType === "file") {
      fileId = shareLink.resourceId;
    } else if (shareLink.resourceType === "folder" && fileIdParam) {
      const { verifyFileInSharedFolder } = await import("@/lib/share/service");
      await verifyFileInSharedFolder(supabase, shareLink.resourceId, fileIdParam);
      fileId = fileIdParam;
    } else {
      throw new ApiError(
        400,
        "INVALID_REQUEST",
        shareLink.resourceType === "folder"
          ? "Share link is for a folder. Provide fileId query param to stream a file."
          : "Share link is for a folder, not a file.",
      );
    }

    const wantsDownload = url.searchParams.get("download") === "1";

    if (wantsDownload && !shareLink.allowDownload) {
      throw new ApiError(
        403,
        "DOWNLOAD_NOT_ALLOWED",
        "This share link does not allow downloads.",
      );
    }

    const resolved = await resolveFileForShareAccess(supabase, fileId);
    if (
      !wantsDownload &&
      (resolved.isSplit || resolved.viewerMode === "download_only")
    ) {
      throw new ApiError(
        403,
        "STREAM_NOT_ALLOWED",
        "This file is not available for inline streaming. Use download instead.",
        { fileId },
      );
    }

    const result = await accessFileContentForShare(supabase, fileId, {
      resolved,
    });

    const disposition = wantsDownload && shareLink.allowDownload
      ? `attachment; filename="${escapeFilename(result.fileName)}"`
      : `inline; filename="${escapeFilename(result.fileName)}"`;

    const headers = new Headers();
    headers.set("Content-Type", result.contentType);
    headers.set("Content-Disposition", disposition);
    if (result.contentLength !== null) {
      headers.set("Content-Length", String(result.contentLength));
    }

    return new Response(result.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
