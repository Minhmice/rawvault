import { ApiError } from "@/lib/api/errors";
import { handleRouteError, ok } from "@/lib/api/responses";
import { signInSeededDevUser } from "@/lib/auth/dev-seeded.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getProvidedDevToken(request: Request): string | null {
  const headerToken = request.headers.get("x-rawvault-dev-token");
  if (headerToken && headerToken.trim().length > 0) {
    return headerToken.trim();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    return bearerToken.length > 0 ? bearerToken : null;
  }

  return null;
}

function assertDevSeededSignInAccess(request: Request): void {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.RAWVAULT_DEV_SEEDED_AUTH_ENABLED !== "true"
  ) {
    throw new ApiError(404, "NOT_FOUND", "Not found.");
  }

  const expectedToken = process.env.RAWVAULT_DEV_SEEDED_AUTH_TOKEN;
  if (!expectedToken) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "RAWVAULT_DEV_SEEDED_AUTH_TOKEN is required when deterministic dev seeded auth is enabled.",
    );
  }

  const providedToken = getProvidedDevToken(request);
  if (!providedToken || providedToken !== expectedToken) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing or invalid dev seeded auth token.");
  }
}

export async function POST(request: Request) {
  try {
    assertDevSeededSignInAccess(request);
    const supabase = await createServerSupabaseClient();
    const response = await signInSeededDevUser(supabase);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
