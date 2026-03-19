import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { listLinkedStorageAccounts } from "@/lib/storage-accounts/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await listLinkedStorageAccounts(supabase, user.id);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
