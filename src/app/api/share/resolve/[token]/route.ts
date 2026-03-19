import { ApiError } from "@/lib/api/errors";
import { handleRouteError, ok } from "@/lib/api/responses";
import { resolveShareByToken } from "@/lib/share/service";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const supabase = createServiceRoleSupabaseClient();

    if (!supabase) {
      throw new ApiError(
        500,
        "SERVER_MISCONFIGURED",
        "Service role client not available for share resolve.",
      );
    }

    const response = await resolveShareByToken(supabase, token);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
