/**
 * Public share folder listing.
 * GET /api/share/v/[token]/folder — lists shared folder contents (no auth).
 * Query: folderId (optional; default = share's resourceId)
 */

import { ApiError } from "@/lib/api/errors";
import { handleRouteError, ok } from "@/lib/api/responses";
import { listSharedFolderContents, resolveShareByToken } from "@/lib/share/service";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

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
        "Service role client not available for share folder.",
      );
    }

    const { shareLink } = await resolveShareByToken(supabase, token);

    if (shareLink.resourceType !== "folder") {
      throw new ApiError(
        400,
        "INVALID_RESOURCE_TYPE",
        "Share link is for a file, not a folder.",
      );
    }

    const url = new URL(request.url);
    const folderIdParam = url.searchParams.get("folderId");
    const folderId = folderIdParam ?? shareLink.resourceId;

    if (folderId !== shareLink.resourceId) {
      const { data: folder, error } = await supabase
        .from("folders")
        .select("id, path")
        .eq("id", folderId)
        .is("deleted_at", null)
        .maybeSingle();

      if (error || !folder) {
        throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found.");
      }

      const { data: rootFolder } = await supabase
        .from("folders")
        .select("path")
        .eq("id", shareLink.resourceId)
        .is("deleted_at", null)
        .maybeSingle();

      if (!rootFolder) {
        throw new ApiError(404, "SHARE_ROOT_NOT_FOUND", "Shared folder no longer exists.");
      }

      const rootPath = (rootFolder as { path: string }).path;
      const childPath = (folder as { path: string }).path;
      const isSameOrDescendant =
        childPath === rootPath || childPath.startsWith(`${rootPath}/`);
      if (!isSameOrDescendant) {
        throw new ApiError(403, "ACCESS_DENIED", "Folder is not within the shared folder.");
      }
    }

    const response = await listSharedFolderContents(supabase, folderId);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
