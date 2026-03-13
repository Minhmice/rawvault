import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listExplorerFiles, parseFilesQuery } from "@/lib/explorer/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const query = parseFilesQuery(new URL(request.url).searchParams);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await listExplorerFiles(supabase, user.id, query);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
