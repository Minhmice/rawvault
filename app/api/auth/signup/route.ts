import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import type { AuthSignUpRequest } from "@/lib/contracts";
import { signUpWithPassword } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<AuthSignUpRequest>(request);
    const supabase = await createServerSupabaseClient();
    const response = await signUpWithPassword(supabase, body);
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
