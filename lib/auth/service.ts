import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { z } from "zod";

import {
  authCredentialsSchema,
  authSessionSchema,
  type AuthSignInRequest,
  type AuthSignUpRequest,
  authUserSchema,
  currentSessionResponseSchema,
  currentUserResponseSchema,
  signInResponseSchema,
  signOutResponseSchema,
  signUpResponseSchema,
  type AuthSession,
  type AuthUser,
  type CurrentSessionResponse,
  type CurrentUserResponse,
  type SignInResponse,
  type SignOutResponse,
  type SignUpResponse,
} from "@/lib/contracts";
import { ApiError } from "@/lib/api/errors";
import { isAuthRateLimitError, isAuthSessionMissingError } from "@/lib/auth/supabase-auth-errors";

function parseInput<T>(schema: z.ZodSchema<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ApiError(400, "VALIDATION_ERROR", "Invalid request payload.", {
      fields: z.flattenError(parsed.error).fieldErrors,
    });
  }

  return parsed.data;
}

function normalizeUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return authUserSchema.parse({
    id: user.id,
    email: user.email ?? null,
  });
}

function normalizeSession(session: Session | null): AuthSession | null {
  if (!session) {
    return null;
  }

  const expiresAt =
    typeof session.expires_at === "number" && Number.isFinite(session.expires_at)
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

  return authSessionSchema.parse({
    userId: session.user.id,
    expiresAt,
  });
}

function authErrorStatus(status: number | undefined, fallback: number): number {
  return typeof status === "number" && status >= 400 && status < 600 ? status : fallback;
}

function devAuthHint(endpoint: string) {
  if (process.env.NODE_ENV !== "development") {
    return undefined;
  }

  return {
    hint: `Use ${endpoint} to avoid local auth rate limits during QA.`,
  };
}

export async function signUpWithPassword(
  supabase: SupabaseClient,
  input: AuthSignUpRequest,
): Promise<SignUpResponse> {
  const payload = parseInput(authCredentialsSchema, input);
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    const status = authErrorStatus(error.status, 400);
    const hint = devAuthHint("/api/auth/dev/seeded-signin");
    const details = isAuthRateLimitError(error)
      ? {
          providerMessage: error.message,
          ...(hint ?? {}),
        }
      : error.message;

    throw new ApiError(
      status,
      "AUTH_SIGN_UP_FAILED",
      "Failed to sign up with email/password.",
      details,
    );
  }

  return signUpResponseSchema.parse({
    success: true,
    user: normalizeUser(data.user),
    session: normalizeSession(data.session),
    emailConfirmationRequired: Boolean(data.user && !data.session),
  });
}

export async function signInWithPassword(
  supabase: SupabaseClient,
  input: AuthSignInRequest,
): Promise<SignInResponse> {
  const payload = parseInput(authCredentialsSchema, input);
  const { data, error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    const status = authErrorStatus(error.status, 401);
    const hint = devAuthHint("/api/auth/dev/seeded-signin");
    const details = isAuthRateLimitError(error)
      ? {
          providerMessage: error.message,
          ...(hint ?? {}),
        }
      : error.message;

    throw new ApiError(
      status,
      "AUTH_SIGN_IN_FAILED",
      "Failed to sign in with email/password.",
      details,
    );
  }

  if (!data.user || !data.session) {
    throw new ApiError(401, "AUTH_SIGN_IN_FAILED", "Email/password sign in did not create a session.");
  }

  return signInResponseSchema.parse({
    success: true,
    user: normalizeUser(data.user),
    session: normalizeSession(data.session),
  });
}

export async function signOutCurrentSession(supabase: SupabaseClient): Promise<SignOutResponse> {
  const { error } = await supabase.auth.signOut({ scope: "local" });

  if (error) {
    if (isAuthSessionMissingError(error)) {
      return signOutResponseSchema.parse({
        success: true,
        signedOut: true,
      });
    }

    throw new ApiError(
      authErrorStatus(error.status, 500),
      "AUTH_SIGN_OUT_FAILED",
      "Failed to sign out current session.",
      error.message,
    );
  }

  return signOutResponseSchema.parse({
    success: true,
    signedOut: true,
  });
}

export async function getCurrentSession(
  supabase: SupabaseClient,
): Promise<CurrentSessionResponse> {
  // Trigger token refresh when possible so downstream API routes see stable auth cookies.
  const { error: userError } = await supabase.auth.getUser();
  if (userError && !isAuthSessionMissingError(userError)) {
    throw new ApiError(
      authErrorStatus(userError.status, 500),
      "AUTH_SESSION_PERSIST_FAILED",
      "Failed to persist current auth session.",
      userError.message,
    );
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    if (isAuthSessionMissingError(error)) {
      return currentSessionResponseSchema.parse({
        success: true,
        session: null,
        user: null,
      });
    }

    throw new ApiError(
      authErrorStatus(error.status, 500),
      "AUTH_SESSION_FETCH_FAILED",
      "Failed to load current auth session.",
      error.message,
    );
  }

  return currentSessionResponseSchema.parse({
    success: true,
    session: normalizeSession(data.session ?? null),
    user: normalizeUser(data.session?.user ?? null),
  });
}

export async function getCurrentUser(supabase: SupabaseClient): Promise<CurrentUserResponse> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    // Supabase returns AuthSessionMissingError when signed out; treat as valid null-user state.
    if (isAuthSessionMissingError(error)) {
      return currentUserResponseSchema.parse({
        success: true,
        user: null,
      });
    }

    throw new ApiError(
      authErrorStatus(error.status, 500),
      "AUTH_USER_FETCH_FAILED",
      "Failed to load current auth user.",
      error.message,
    );
  }

  return currentUserResponseSchema.parse({
    success: true,
    user: normalizeUser(data.user ?? null),
  });
}

export async function persistCurrentSession(
  supabase: SupabaseClient,
): Promise<CurrentSessionResponse> {
  return getCurrentSession(supabase);
}
