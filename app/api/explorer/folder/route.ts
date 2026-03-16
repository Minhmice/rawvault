/**
 * Create a folder on the provider in the current explorer context.
 * POST /api/explorer/folder — body: { accountId, providerFolderId?, name }
 */

import { handleRouteError, ok } from "@/lib/api/responses";
import {
  createExplorerFolderRequestSchema,
  createExplorerFolderResponseSchema,
} from "@/lib/contracts/explorer-folder.contracts";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import { createFolderOnProvider } from "@/lib/explorer/create-folder.service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      throw new ApiError(400, "VALIDATION_ERROR", "Request body must be an object.");
    }

    const parsed = createExplorerFolderRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid request.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const result = await createFolderOnProvider(supabase, user.id, {
      accountId: parsed.data.accountId,
      providerFolderId: parsed.data.providerFolderId ?? null,
      name: parsed.data.name,
    });

    const response = createExplorerFolderResponseSchema.parse({
      success: true as const,
      providerFolderId: result.providerFolderId,
    });
    return ok(response, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
