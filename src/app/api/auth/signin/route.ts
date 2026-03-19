import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import type { AuthSignInRequest } from "@/lib/contracts";
import { signInWithPassword } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<AuthSignInRequest>(request);
    const supabase = await createServerSupabaseClient();
    const response = await signInWithPassword(supabase, body);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
