import { ApiError } from "@/lib/api/errors";

/**
 * Validates required environment variables at server startup.
 * Does NOT validate OAuth provider vars (those are validated on connect).
 * @throws ApiError 500 SERVER_MISCONFIGURED with clear message for each missing var
 */
export function validateRequiredEnv(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.trim() === "") {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if ((!anonKey || anonKey.trim() === "") && (!publishableKey || publishableKey.trim() === "")) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)",
    );
  }

  const encryptionKey = process.env.RAWVAULT_TOKEN_ENCRYPTION_KEY;
  if (!encryptionKey || encryptionKey.trim() === "") {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "Missing required environment variable: RAWVAULT_TOKEN_ENCRYPTION_KEY",
    );
  }
}
