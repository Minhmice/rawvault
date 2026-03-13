import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { CreateLinkAccountRequest } from "@/lib/contracts";
import { linkStorageAccount } from "@/lib/storage-accounts/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<CreateLinkAccountRequest>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await linkStorageAccount(supabase, user.id, body);
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
