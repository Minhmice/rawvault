import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { jsonError, ErrorCodes } from "@/lib/api-error";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const LoginBodySchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("password"),
    email: z.string().email(),
    password: z.string().min(1),
  }),
  z.object({
    method: z.literal("magic_link"),
    email: z.string().email(),
  }),
]);

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, ErrorCodes.VALIDATION, "Invalid JSON body");
  }

  const parsed = LoginBodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, ErrorCodes.VALIDATION, "Validation failed", parsed.error.flatten());
  }

  const { method, email } = parsed.data;

  if (method === "magic_link") {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/`,
      },
    });
    if (error) {
      return jsonError(401, "auth_error", error.message);
    }
    return Response.json({
      ok: true,
      message: "Check your email for the magic link",
    });
  }

  const { password } = parsed.data;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return jsonError(401, "auth_error", error.message);
  }

  return Response.json({ ok: true, user: { id: data.user.id, email: data.user.email } });
}
