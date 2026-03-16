/**
 * Stream file by provider context (accountId + providerFileId).
 * Used when opening a file from the unified explorer list.
 * GET /api/explorer/stream?accountId=&providerFileId=&name=
 * Optional ?download=1 for attachment disposition.
 */

import { handleRouteError } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { accessFileContentByProvider } from "@/lib/file-access/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

function escapeFilename(name: string): string {
  return name.replace(/[^\w\s.-]/g, "_").slice(0, 200);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId")?.trim();
    const providerFileId = searchParams.get("providerFileId")?.trim();
    const name = searchParams.get("name")?.trim() ?? "file";
    const download = searchParams.get("download") === "1";

    if (!accountId || !providerFileId) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "accountId and providerFileId are required.",
      );
    }

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const result = await accessFileContentByProvider(
      supabase,
      user.id,
      accountId,
      providerFileId,
      { fileName: name },
    );

    const disposition = download
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
