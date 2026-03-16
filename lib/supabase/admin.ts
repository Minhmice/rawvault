import { createClient } from "@supabase/supabase-js";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payload = parts[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function isServiceRoleKey(key: string): boolean {
  if (key.startsWith("sb_secret_")) {
    return true;
  }

  const payload = decodeJwtPayload(key);
  return payload?.role === "service_role";
}

export function createServiceRoleSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    console.error("[admin] createServiceRoleSupabaseClient: NEXT_PUBLIC_SUPABASE_URL is missing");
    return null;
  }
  if (!serviceRoleKey) {
    console.error("[admin] createServiceRoleSupabaseClient: SUPABASE_SERVICE_ROLE_KEY is missing or empty");
    return null;
  }
  if (!isServiceRoleKey(serviceRoleKey)) {
    const payload = decodeJwtPayload(serviceRoleKey);
    const role = payload?.role;
    console.error(
      "[admin] createServiceRoleSupabaseClient: SUPABASE_SERVICE_ROLE_KEY invalid format. " +
        "Expected JWT with payload.role === 'service_role' or key starting with 'sb_secret_'. " +
        `Got role=${role ?? "undefined"} (key length=${serviceRoleKey.length})`,
    );
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
