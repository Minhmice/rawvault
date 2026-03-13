type MaybeSupabaseAuthError = {
  name?: string;
  status?: number;
  code?: string;
  message?: string;
} | null;

function normalizedMessage(error: MaybeSupabaseAuthError): string {
  return String(error?.message ?? "").toLowerCase();
}

export function isAuthSessionMissingError(error: MaybeSupabaseAuthError): boolean {
  if (!error) {
    return false;
  }

  return (
    error.name === "AuthSessionMissingError" ||
    error.code === "session_not_found" ||
    normalizedMessage(error).includes("auth session missing")
  );
}

export function isAuthRateLimitError(error: MaybeSupabaseAuthError): boolean {
  if (!error) {
    return false;
  }

  return error.status === 429 || normalizedMessage(error).includes("rate limit");
}
