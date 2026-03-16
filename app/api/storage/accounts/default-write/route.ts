/**
 * Set the default write account for uploads (when no account/folder is specified).
 * POST /api/storage/accounts/default-write — body: { accountId }
 * One default per user; others are cleared.
 */

import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { setDefaultWriteAccountRequestSchema } from "@/lib/contracts";
import { setDefaultWriteAccount } from "@/lib/storage-accounts/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must be an object.");
    }

    const parsed = setDefaultWriteAccountRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await setDefaultWriteAccount(supabase, user.id, parsed.data);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
