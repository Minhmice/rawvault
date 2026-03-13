import { NextResponse } from "next/server";

import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  buildProviderConnectCallbackErrorRedirectUrl,
  buildProviderConnectCallbackRedirectUrl,
  completeProviderOAuthCallback,
} from "@/lib/storage-accounts/oauth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function readQueryValue(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim();
  return value ? value : undefined;
}

function wantsJson(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("application/json");
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const callbackInput = {
    state: readQueryValue(query, "state"),
    code: readQueryValue(query, "code"),
    error: readQueryValue(query, "error"),
    errorDescription:
      readQueryValue(query, "error_description") ??
      readQueryValue(query, "errorDescription"),
    redirectUri: readQueryValue(query, "redirectUri"),
  };

  try {
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);
    const result = await completeProviderOAuthCallback(supabase, user.id, callbackInput);

    if (wantsJson(request)) {
      return ok(result.response);
    }

    return NextResponse.redirect(
      buildProviderConnectCallbackRedirectUrl(result.returnTo, result.response.callback),
      302,
    );
  } catch (error) {
    if (!wantsJson(request)) {
      const redirectUrl = buildProviderConnectCallbackErrorRedirectUrl(
        callbackInput.state,
        error,
      );
      if (redirectUrl) {
        return NextResponse.redirect(redirectUrl, 302);
      }
    }

    return handleRouteError(error);
  }
}
