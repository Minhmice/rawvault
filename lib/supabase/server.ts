import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { ApiError } from "@/lib/api/errors";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      `Missing required environment variable: ${name}`,
    );
  }

  return value;
}

function getSupabasePublicKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (anonKey) {
    return anonKey;
  }

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (publishableKey) {
    return publishableKey;
  }

  throw new ApiError(
    500,
    "SERVER_MISCONFIGURED",
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookieList) {
          for (const { name, value, options } of cookieList) {
            cookieStore.set(name, value, options);
          }
        },
      },
    },
  );
}
