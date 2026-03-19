import { handleRouteError, ok } from "@/lib/api/responses";
import { persistCurrentSession } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const response = await persistCurrentSession(supabase);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
