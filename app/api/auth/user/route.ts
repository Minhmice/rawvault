import { handleRouteError, ok } from "@/lib/api/responses";
import { getCurrentUser } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const response = await getCurrentUser(supabase);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
