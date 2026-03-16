import type { SupabaseClient, User } from "@supabase/supabase-js";

import { ApiError } from "@/lib/api/errors";
import { authUserSchema, type AuthUser } from "@/lib/contracts";

const AUTH_REQUIRED_MESSAGE = "Authentication is required.";

function toAuthUser(user: User): AuthUser {
  const email =
    user.email && String(user.email).trim().length > 0
      ? String(user.email).trim()
      : null;
  return authUserSchema.parse({
    id: user.id,
    email,
  });
}

export async function requireAuthenticatedUser(
  supabase: SupabaseClient,
): Promise<AuthUser> {
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    throw new ApiError(401, "UNAUTHORIZED", AUTH_REQUIRED_MESSAGE);
  }

  try {
    return toAuthUser(data.user);
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", AUTH_REQUIRED_MESSAGE);
  }
}
