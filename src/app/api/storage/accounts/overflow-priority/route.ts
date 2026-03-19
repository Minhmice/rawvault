/**
 * Set overflow priority for an account (lower = used first when default is full).
 * PATCH /api/storage/accounts/overflow-priority — body: { accountId, overflowPriority }
 */

import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { setOverflowPriorityRequestSchema } from "@/lib/contracts";
import { setOverflowPriority } from "@/lib/storage-accounts/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";

export async function PATCH(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must be an object.");
    }

    const parsed = setOverflowPriorityRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const response = await setOverflowPriority(supabase, user.id, parsed.data);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
