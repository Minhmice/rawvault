import type { SupabaseClient, User } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/errors";
import { authUserSchema, type AuthUser } from "@/lib/contracts";

function toAuthUser(user: User): AuthUser {
  return authUserSchema.parse({
    id: user.id,
    email: user.email ?? null,
  });
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<AuthUser> {
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    return toAuthUser(data.user);
  }

  throw new ApiError(401, "UNAUTHORIZED", "Authentication is required.");
}
