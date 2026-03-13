/**
 * Phase 9: File stream route.
 * GET /api/files/[id]/stream — returns file content with inline disposition for browser preview.
 */

import { handleRouteError } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { accessFileContent } from "@/lib/file-access/service";
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

    const result = await accessFileContent(supabase, user.id, id);

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
