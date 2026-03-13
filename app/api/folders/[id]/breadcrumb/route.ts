import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { getFolderBreadcrumb } from "@/lib/metadata/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await getFolderBreadcrumb(supabase, user.id, id);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
