import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { UnlinkAccountRequest } from "@/lib/contracts";
import { unlinkStorageAccount } from "@/lib/storage-accounts/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<UnlinkAccountRequest>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await unlinkStorageAccount(supabase, user.id, body);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
