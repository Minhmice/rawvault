/**
 * Phase 9: File stream route.
 * GET /api/files/[id]/stream — returns file content with inline disposition for browser preview.
 * Returns 403 for split files or viewer_mode=download_only (use download route instead).
 */

import { ApiError } from "@/lib/api/errors";
import { handleRouteError } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { accessFileContent, resolveFileForAccess } from "@/lib/file-access/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function escapeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "_").slice(0, 200);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const resolved = await resolveFileForAccess(supabase, user.id, id);
    if (resolved.isSplit || resolved.viewerMode === "download_only") {
      throw new ApiError(
        403,
        "STREAM_NOT_ALLOWED",
        "This file is not available for inline streaming. Use download instead.",
        { fileId: id },
      );
    }

    const result = await accessFileContent(supabase, user.id, id, {
      resolved,
    });

    const disposition = `inline; filename="${escapeFilename(result.fileName)}"`;
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
