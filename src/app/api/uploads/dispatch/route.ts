import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { UploadDispatchRequest } from "@/lib/contracts";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { dispatchUploadTarget } from "@/lib/uploads/dispatch.service";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<UploadDispatchRequest>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await dispatchUploadTarget(supabase, user.id, body);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
