import { NextResponse } from "next/server";

import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { startProviderOAuthConnect } from "@/lib/storage-accounts/oauth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function readQueryValue(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = startProviderOAuthConnect(user.id, {
      provider: readQueryValue(query, "provider"),
      returnTo: readQueryValue(query, "returnTo"),
      redirectUri: readQueryValue(query, "redirectUri"),
    });

    if (wantsJson(request)) {
      return ok(response);
    }

    return NextResponse.redirect(response.authorizationUrl, 302);
  } catch (error) {
    return handleRouteError(error);
  }
}
