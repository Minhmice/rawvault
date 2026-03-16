import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import type { CreateShareRequest } from "@/lib/contracts/share.contracts";
import { createShareLink, listShareLinks } from "@/lib/share/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await listShareLinks(supabase, user.id);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<CreateShareRequest>(request);
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await createShareLink(supabase, user.id, body);
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
